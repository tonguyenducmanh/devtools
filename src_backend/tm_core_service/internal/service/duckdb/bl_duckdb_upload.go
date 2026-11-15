// Package duckdb chứa handler upload file cho DuckDB Query Tool.
// File được lưu tạm vào OS temp dir và nạp vào session DuckDB dưới dạng view.

package duckdb

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/google/uuid"
	duckdb "tm_core_service/internal/database/duckdb"
	"tm_core_service/internal/model"
	"tm_core_service/tm_common"
)

// UploadDuckDBFileHandler nhận file upload qua multipart/form-data, lưu tạm,
// sau đó nạp vào session DuckDB dưới dạng view để query.
//
// POST /duckdb/upload_file
// Form fields: "file" (required), "session_id" (required), "table_name" (optional)
func UploadDuckDBFileHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			tm_common.LogError(fmt.Sprintf("PANIC in UploadDuckDBFileHandler: %v", rec))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": fmt.Sprintf("Internal server error: %v", rec),
			})
		}
	}()

	// Giới hạn 500 MB
	r.ParseMultipartForm(500 << 20)

	sessionID := r.FormValue("session_id")
	if sessionID == "" {
		writeJSON(w, false, "session_id là bắt buộc", nil)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, false, "Không đọc được file upload: "+err.Error(), nil)
		return
	}
	defer file.Close()

	origName := header.Filename
	ext := strings.ToLower(filepath.Ext(origName))

	// Kiểm tra định dạng được hỗ trợ
	supportedExts := map[string]bool{
		".xlsx": true, ".xls": true, ".ods": true,
		".csv": true, ".tsv": true,
		".parquet": true,
		".json": true, ".ndjson": true, ".jsonl": true,
	}
	if !supportedExts[ext] {
		writeJSON(w, false, fmt.Sprintf("Định dạng file '%s' không được hỗ trợ. Hỗ trợ: xlsx, xls, ods, csv, parquet, json", ext), nil)
		return
	}

	// Tên table: lấy từ form hoặc tự sinh từ tên file
	tableName := r.FormValue("table_name")
	if tableName == "" {
		tableName = sanitizeTableName(strings.TrimSuffix(origName, ext))
	}
	if tableName == "" {
		tableName = "data"
	}

	// Lưu file tạm
	fileID := uuid.NewString()
	tmpDir := os.TempDir()
	tmpPath := filepath.Join(tmpDir, fmt.Sprintf("duckdb_%s%s", fileID, ext))

	dst, err := os.Create(tmpPath)
	if err != nil {
		writeJSON(w, false, "Không tạo được file tạm: "+err.Error(), nil)
		return
	}
	defer dst.Close()

	buf := make([]byte, 32*1024)
	for {
		n, readErr := file.Read(buf)
		if n > 0 {
			if _, writeErr := dst.Write(buf[:n]); writeErr != nil {
				writeJSON(w, false, "Lỗi ghi file tạm: "+writeErr.Error(), nil)
				return
			}
		}
		if readErr != nil {
			break
		}
	}
	dst.Close()

	// Nạp file vào DuckDB session
	results, err := duckdb.LoadFile(sessionID, tmpPath, tableName, fileID, origName)
	if err != nil {
		os.Remove(tmpPath)
		writeJSON(w, false, "Lỗi nạp file vào DuckDB: "+err.Error(), nil)
		return
	}

	infos := make([]model.TMDuckDBFileInfo, 0, len(results))
	for _, r := range results {
		infos = append(infos, model.TMDuckDBFileInfo{
			TableName: r.TableName,
			FileName:  origName,
			Columns:   r.Columns,
			RowCount:  r.RowCount,
			FileID:    fileID,
		})
	}

	writeJSON(w, true, "", infos)
}

// DropDuckDBFileHandler xoá 1 file/view khỏi session DuckDB.
//
// POST /duckdb/drop_file
// Body: { "session_id": "...", "file_id": "..." }
func DropDuckDBFileHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			tm_common.LogError(fmt.Sprintf("PANIC in DropDuckDBFileHandler: %v", rec))
			writeJSON(w, false, fmt.Sprintf("Internal server error: %v", rec), nil)
		}
	}()

	var req struct {
		SessionID string `json:"session_id"`
		FileID    string `json:"file_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, false, "Dữ liệu không hợp lệ", nil)
		return
	}
	if req.SessionID == "" || req.FileID == "" {
		writeJSON(w, false, "session_id và file_id là bắt buộc", nil)
		return
	}

	if err := duckdb.DropFile(req.SessionID, req.FileID); err != nil {
		writeJSON(w, false, err.Error(), nil)
		return
	}
	writeJSON(w, true, "", nil)
}

// DropAllDuckDBFilesHandler xoá tất cả file/view trong session DuckDB.
//
// POST /duckdb/drop_all_files
// Body: { "session_id": "..." }
func DropAllDuckDBFilesHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			tm_common.LogError(fmt.Sprintf("PANIC in DropAllDuckDBFilesHandler: %v", rec))
			writeJSON(w, false, fmt.Sprintf("Internal server error: %v", rec), nil)
		}
	}()

	var req struct {
		SessionID string `json:"session_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, false, "Dữ liệu không hợp lệ", nil)
		return
	}
	if req.SessionID == "" {
		writeJSON(w, false, "session_id là bắt buộc", nil)
		return
	}

	files := duckdb.GetSessionFiles(req.SessionID)
	for _, f := range files {
		_, _, _ = duckdb.RunDuckDB(
			"",
			fmt.Sprintf("DROP VIEW IF EXISTS \"%s\"", duckdb.EscapeDQ(f.TableName)),
		)
	}
	duckdb.ClearSessionFiles(req.SessionID)

	writeJSON(w, true, "", nil)
}

// GetSessionFilesHandler trả về danh sách file đã nạp trong session.
//
// GET /duckdb/session_files?session_id=...
func GetSessionFilesHandler(w http.ResponseWriter, r *http.Request) {
	sessionID := r.URL.Query().Get("session_id")
	if sessionID == "" {
		writeJSON(w, false, "session_id là bắt buộc", nil)
		return
	}
	files := duckdb.GetSessionFiles(sessionID)
	type fileInfo struct {
		FileID    string `json:"file_id"`
		FileName  string `json:"file_name"`
		TableName string `json:"table_name"`
		RowCount  int64  `json:"row_count"`
	}
	result := make([]fileInfo, 0, len(files))
	for _, f := range files {
		result = append(result, fileInfo{
			FileID:    f.FileID,
			FileName:  f.FileName,
			TableName: f.TableName,
			RowCount:  f.RowCount,
		})
	}
	writeJSON(w, true, "", result)
}

// DropDuckDBSessionHandler xoá toàn bộ session khỏi memory.
//
// POST /duckdb/drop_session
// Body: { "session_id": "..." }
func DropDuckDBSessionHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SessionID string `json:"session_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SessionID == "" {
		writeJSON(w, false, "session_id là bắt buộc", nil)
		return
	}
	duckdb.DropSession(req.SessionID)
	writeJSON(w, true, "", nil)
}

// writeJSON helper ghi JSON response chuẩn {success, message, data}.
func writeJSON(w http.ResponseWriter, success bool, message string, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	resp := map[string]interface{}{
		"success": success,
		"message": message,
	}
	if data != nil {
		resp["data"] = data
	}
	if encodeErr := json.NewEncoder(w).Encode(resp); encodeErr != nil {
		tm_common.LogError(fmt.Sprintf("Lỗi encode JSON response: %v", encodeErr))
	}
}

// sanitizeTableName chuyển tên file thành identifier hợp lệ cho DuckDB.
// Giữ lại chữ, số và dấu gạch dưới; thay thế ký tự khác bằng "_".
func sanitizeTableName(name string) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9_]`)
	result := reg.ReplaceAllString(name, "_")
	// Không được bắt đầu bằng số
	if len(result) > 0 && result[0] >= '0' && result[0] <= '9' {
		result = "_" + result
	}
	return strings.ToLower(result)
}
