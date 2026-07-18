// file này chứa logic backup, restore, clone database PostgreSQL bằng pg_dump / pg_restore

package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"td_core_service/internal/model"
	"td_core_service/td_common"
)

// getTempDir tạo thư mục tạm riêng cho mỗi lần ops
func getTempDir() (string, error) {
	dir, err := os.MkdirTemp("", "td_pg_ops_*")
	if err != nil {
		return "", err
	}
	return dir, nil
}

// resolveCommand tìm executable trong pg_bin_path hoặc PATH
func resolveCommand(name string, pgBinPath string) (string, error) {
	if pgBinPath != "" {
		fullPath := filepath.Join(pgBinPath, name)
		if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
			return fullPath, nil
		}
		fullPathExe := filepath.Join(pgBinPath, name+".exe")
		if info, err := os.Stat(fullPathExe); err == nil && !info.IsDir() {
			return fullPathExe, nil
		}
		return "", fmt.Errorf("%s không tìm thấy tại: %s", name, pgBinPath)
	}
	path, err := exec.LookPath(name)
	if err != nil {
		return "", fmt.Errorf("%s không tìm thấy trên hệ thống. Vui lòng cài đặt PostgreSQL client tools hoặc nhập đường dẫn PostgreSQL bin", name)
	}
	return path, nil
}

// createDatabaseIfNotExists tạo database mới nếu chưa tồn tại
func createDatabaseIfNotExists(host, port, user, password, dbname, pgBinPath string) error {
	psqlPath, err := resolveCommand("psql", pgBinPath)
	if err != nil {
		return fmt.Errorf("psql không tìm thấy: %w", err)
	}

	// Kiểm tra database đã tồn tại chưa
	checkArgs := []string{
		"-h", host, "-p", port, "-U", user,
		"-d", "postgres",
		"--tuples-only", "--no-align",
		"-c", fmt.Sprintf("SELECT 1 FROM pg_database WHERE datname = '%s'", dbname),
	}
	checkCmd := exec.Command(psqlPath, checkArgs...)
	checkCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", password))
	var checkStdout, checkStderr bytes.Buffer
	checkCmd.Stdout = &checkStdout
	checkCmd.Stderr = &checkStderr
	if err := checkCmd.Run(); err != nil {
		errMsg := strings.TrimSpace(checkStderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}
		return fmt.Errorf("lỗi kiểm tra database: %s", errMsg)
	}
	if strings.Contains(checkStdout.String(), "1") {
		td_common.LogInfo(fmt.Sprintf("Database '%s' đã tồn tại, bỏ qua tạo mới", dbname))
		return nil
	}

	// Tạo database mới
	td_common.LogInfo(fmt.Sprintf("Tạo database mới: %s", dbname))
	createArgs := []string{
		"-h", host, "-p", port, "-U", user,
		"-d", "postgres",
		"-c", fmt.Sprintf("CREATE DATABASE \"%s\"", dbname),
	}
	createCmd := exec.Command(psqlPath, createArgs...)
	createCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", password))
	var createStdout, createStderr bytes.Buffer
	createCmd.Stdout = &createStdout
	createCmd.Stderr = &createStderr
	if err := createCmd.Run(); err != nil {
		errMsg := strings.TrimSpace(createStderr.String())
		stdoutMsg := strings.TrimSpace(createStdout.String())
		if stdoutMsg != "" {
			errMsg = stdoutMsg + "\n" + errMsg
		}
		if errMsg == "" {
			errMsg = err.Error()
		}
		return fmt.Errorf("tạo database thất bại: %s", errMsg)
	}
	td_common.LogInfo(fmt.Sprintf("Tạo database '%s' thành công", dbname))
	return nil
}

// ExecutePostgreSQLDatabaseOpsHandler xử lý JSON-based ops (backup, clone)
func ExecutePostgreSQLDatabaseOpsHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			td_common.LogError(fmt.Sprintf("PANIC in ExecutePostgreSQLDatabaseOpsHandler: %v", rec))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": fmt.Sprintf("Internal server error: %v", rec),
			})
		}
	}()

	var req model.TDPgDatabaseOpsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.SourceHost == "" || req.SourceDB == "" || req.SourceUser == "" {
		http.Error(w, "source_host, source_db, source_user là bắt buộc", http.StatusBadRequest)
		return
	}

	switch req.Operation {
	case "backup":
		handleBackup(w, &req)
	case "clone":
		handleClone(w, &req)
	default:
		http.Error(w, "operation không hợp lệ (backup/clone)", http.StatusBadRequest)
	}
}

// ExecutePostgreSQLDatabaseOpsUploadHandler xử lý restore via file upload (multipart/form-data)
func ExecutePostgreSQLDatabaseOpsUploadHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			td_common.LogError(fmt.Sprintf("PANIC in ExecutePostgreSQLDatabaseOpsUploadHandler: %v", rec))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": fmt.Sprintf("Internal server error: %v", rec),
			})
		}
	}()

	// Parse multipart form
	if err := r.ParseMultipartForm(0); err != nil {
		writeJSONResponse(w, false, "Không thể đọc file upload: "+err.Error(), "")
		return
	}

	// Lấy connection fields từ form
	srcHost := r.FormValue("source_host")
	srcPort := r.FormValue("source_port")
	srcUser := r.FormValue("source_user")
	srcPassword := r.FormValue("source_password")
	srcDB := r.FormValue("source_db")
	pgBinPath := r.FormValue("pg_bin_path")

	if srcHost == "" || srcDB == "" || srcUser == "" {
		writeJSONResponse(w, false, "source_host, source_db, source_user là bắt buộc", "")
		return
	}

	// Lấy file dump
	file, handler, err := r.FormFile("dump_file")
	if err != nil {
		writeJSONResponse(w, false, "Vui lòng chọn file dump để restore", "")
		return
	}
	defer file.Close()

	// Tạo thư mục tạm và lưu file
	tempDir, err := getTempDir()
	if err != nil {
		writeJSONResponse(w, false, fmt.Sprintf("Lỗi tạo thư mục tạm: %v", err), "")
		return
	}
	defer os.RemoveAll(tempDir)

	dumpFilePath := filepath.Join(tempDir, handler.Filename)
	out, err := os.Create(dumpFilePath)
	if err != nil {
		writeJSONResponse(w, false, fmt.Sprintf("Lỗi tạo file tạm: %v", err), "")
		return
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		writeJSONResponse(w, false, fmt.Sprintf("Lỗi lưu file dump: %v", err), "")
		return
	}
	out.Close()

	td_common.LogInfo(fmt.Sprintf("File dump uploaded: %s (%d bytes)", handler.Filename, handler.Size))

	// Tự động tạo database đích nếu chưa tồn tại
	if err := createDatabaseIfNotExists(srcHost, srcPort, srcUser, srcPassword, srcDB, pgBinPath); err != nil {
		writeJSONResponse(w, false, fmt.Sprintf("Lỗi tạo database đích: %s", err.Error()), "")
		return
	}

	// psql restore từ file
	psqlPath, err := resolveCommand("psql", pgBinPath)
	if err != nil {
		writeJSONResponse(w, false, err.Error(), "")
		return
	}

	args := []string{
		"-h", srcHost,
		"-p", srcPort,
		"-U", srcUser,
		"-d", srcDB,
		"--quiet",
		"-f", dumpFilePath,
	}

	cmd := exec.Command(psqlPath, args...)
	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", srcPassword))

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	td_common.LogInfo(fmt.Sprintf("Running psql restore to %s@%s:%s/%s from %s", srcUser, srcHost, srcPort, srcDB, handler.Filename))

	if err := cmd.Run(); err != nil {
		errMsg := strings.TrimSpace(stderr.String())
		stdoutMsg := strings.TrimSpace(stdout.String())
		if stdoutMsg != "" {
			errMsg = stdoutMsg + "\n" + errMsg
		}
		if errMsg == "" {
			errMsg = err.Error()
		}
		writeJSONResponse(w, false, fmt.Sprintf("pg_restore thất bại: %s", errMsg), "")
		return
	}

	td_common.LogInfo("Restore database thành công")
	writeJSONResponse(w, true, "Restore database thành công", "")
}

// handleBackup thực hiện pg_dump và trả về file SQL text
func handleBackup(w http.ResponseWriter, req *model.TDPgDatabaseOpsRequest) {
	pgDumpPath, err := resolveCommand("pg_dump", req.PgBinPath)
	if err != nil {
		writeJSONResponse(w, false, err.Error(), "")
		return
	}

	host := req.SourceHost
	port := req.SourcePort
	if port == "" {
		port = "5432"
	}
	user := req.SourceUser
	password := req.SourcePassword
	dbname := req.SourceDB

	// Plain text SQL format — dễ đọc
	args := []string{
		"-h", host,
		"-p", port,
		"-U", user,
		"-d", dbname,
		"--no-owner",
		"--no-privileges",
		"--clean",
		"--if-exists",
	}

	cmd := exec.Command(pgDumpPath, args...)
	cmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", password))

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	td_common.LogInfo(fmt.Sprintf("Running pg_dump for database %s@%s:%s/%s", user, host, port, dbname))

	if err := cmd.Run(); err != nil {
		errMsg := strings.TrimSpace(stderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}
		writeJSONResponse(w, false, fmt.Sprintf("pg_dump thất bại: %s", errMsg), "")
		return
	}

	// pg_dump có thể exit 0 nhưng vẫn ghi lỗi ra stderr
	if stderr.Len() > 0 {
		errMsg := strings.TrimSpace(stderr.String())
		writeJSONResponse(w, false, fmt.Sprintf("pg_dump cảnh báo/lỗi: %s", errMsg), "")
		return
	}

	dumpBytes := stdout.Bytes()
	td_common.LogInfo(fmt.Sprintf("pg_dump thành công, size: %d bytes", len(dumpBytes)))

	// Trả về file SQL text
	w.Header().Set("Content-Type", "text/sql; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="backup_%s.sql"`, dbname))
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(dumpBytes)))
	w.Write(dumpBytes)
}

// handleClone thực hiện clone database từ nguồn sang đích bằng pg_dump -Fc | pg_restore
func handleClone(w http.ResponseWriter, req *model.TDPgDatabaseOpsRequest) {
	if req.TargetHost == "" || req.TargetDB == "" || req.TargetUser == "" {
		writeJSONResponse(w, false, "target_host, target_db, target_user là bắt buộc cho thao tác clone", "")
		return
	}

	pgDumpPath, err := resolveCommand("pg_dump", req.PgBinPath)
	if err != nil {
		writeJSONResponse(w, false, err.Error(), "")
		return
	}

	psqlPath, err := resolveCommand("psql", req.PgBinPath)
	if err != nil {
		writeJSONResponse(w, false, err.Error(), "")
		return
	}

	srcHost := req.SourceHost
	srcPort := req.SourcePort
	if srcPort == "" {
		srcPort = "5432"
	}
	srcUser := req.SourceUser
	srcPassword := req.SourcePassword
	srcDB := req.SourceDB

	tgtHost := req.TargetHost
	tgtPort := req.TargetPort
	if tgtPort == "" {
		tgtPort = "5432"
	}
	tgtUser := req.TargetUser
	tgtPassword := req.TargetPassword
	tgtDB := req.TargetDB

	// Tự động tạo DB đích nếu chưa tồn tại
	if err := createDatabaseIfNotExists(tgtHost, tgtPort, tgtUser, tgtPassword, tgtDB, req.PgBinPath); err != nil {
		writeJSONResponse(w, false, fmt.Sprintf("Lỗi tạo database đích: %s", err.Error()), "")
		return
	}

	td_common.LogInfo(fmt.Sprintf("Cloning database: %s@%s:%s/%s -> %s@%s:%s/%s",
		srcUser, srcHost, srcPort, srcDB, tgtUser, tgtHost, tgtPort, tgtDB))

	// pg_dump plain text SQL từ nguồn
	dumpArgs := []string{
		"-h", srcHost,
		"-p", srcPort,
		"-U", srcUser,
		"-d", srcDB,
		"--no-owner",
		"--no-privileges",
		"--clean",
		"--if-exists",
	}

	dumpCmd := exec.Command(pgDumpPath, dumpArgs...)
	dumpCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", srcPassword))

	var dumpStdout, dumpStderr bytes.Buffer
	dumpCmd.Stdout = &dumpStdout
	dumpCmd.Stderr = &dumpStderr

	if err := dumpCmd.Run(); err != nil {
		errMsg := strings.TrimSpace(dumpStderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}
		writeJSONResponse(w, false, fmt.Sprintf("pg_dump (nguồn) thất bại: %s", errMsg), "")
		return
	}

	if dumpStderr.Len() > 0 {
		errMsg := strings.TrimSpace(dumpStderr.String())
		writeJSONResponse(w, false, fmt.Sprintf("pg_dump (nguồn) cảnh báo/lỗi: %s", errMsg), "")
		return
	}

	td_common.LogInfo(fmt.Sprintf("pg_dump thành công, size: %d bytes", dumpStdout.Len()))

	// psql plain text SQL vào đích
	restoreArgs := []string{
		"-h", tgtHost,
		"-p", tgtPort,
		"-U", tgtUser,
		"-d", tgtDB,
		"--quiet",
	}

	restoreCmd := exec.Command(psqlPath, restoreArgs...)
	restoreCmd.Env = append(os.Environ(), fmt.Sprintf("PGPASSWORD=%s", tgtPassword))
	restoreCmd.Stdin = &dumpStdout

	var restoreStderr bytes.Buffer
	restoreCmd.Stderr = &restoreStderr

	if err := restoreCmd.Run(); err != nil {
		errMsg := strings.TrimSpace(restoreStderr.String())
		if errMsg == "" {
			errMsg = err.Error()
		}
		writeJSONResponse(w, false, fmt.Sprintf("psql (đích) thất bại: %s", errMsg), "")
		return
	}

	td_common.LogInfo("Clone database thành công")
	writeJSONResponse(w, true, fmt.Sprintf("Clone database thành công (%d bytes)", dumpStdout.Len()), "")
}

// writeJSONResponse helper viết JSON response
func writeJSONResponse(w http.ResponseWriter, success bool, message string, dumpData string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   success,
		"message":   message,
		"dump_data": dumpData,
	})
}
