package postgresql

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"td_core_service/td_common"
)

// DetectPgBinPathResponse là response cho endpoint detect PostgreSQL bin path
type DetectPgBinPathResponse struct {
	Success bool   `json:"success"`
	Path    string `json:"path"`
	Message string `json:"message"`
}

// DetectPostgreSQLBinPathHandler tự động tìm đường dẫn PostgreSQL bin trên hệ thống
// Scan folder con, sắp xếp theo version giảm dần, gặp folder nào có pg_dump là return
func DetectPostgreSQLBinPathHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			td_common.LogError(fmt.Sprintf("PANIC in DetectPostgreSQLBinPathHandler: %v", rec))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(DetectPgBinPathResponse{
				Success: false,
				Message: fmt.Sprintf("Internal server error: %v", rec),
			})
		}
	}()

	// Nếu pg_dump đã có trong PATH thì return luôn
	if path, err := exec.LookPath("pg_dump"); err == nil {
		binDir := filepath.Dir(path)
		td_common.LogInfo(fmt.Sprintf("PostgreSQL bin đã có trong PATH: %s", binDir))
		writeDetectResponse(w, true, binDir, "")
		return
	}

	// Scan theo OS, sắp xếp version cao nhất trước
	osName := runtime.GOOS
	td_common.LogInfo(fmt.Sprintf("OS: %s, đang tìm PostgreSQL bin...", osName))

	parentDirs := getPostgreSQLParentDirs(osName)
	for _, parentDir := range parentDirs {
		if found := scanForHighestVersion(parentDir); found != "" {
			td_common.LogInfo(fmt.Sprintf("Tìm thấy PostgreSQL bin tại: %s", found))
			writeDetectResponse(w, true, found, "")
			return
		}
	}

	td_common.LogInfo("Không tìm thấy PostgreSQL bin trên hệ thống")
	writeDetectResponse(w, false, "", "Không tìm thấy PostgreSQL bin. Vui lòng cài đặt PostgreSQL client tools hoặc nhập đường dẫn thủ công")
}

// getPostgreSQLParentDirs trả về danh sách thư mục cha chứa các version PostgreSQL
func getPostgreSQLParentDirs(osName string) []string {
	home, _ := os.UserHomeDir()

	switch osName {
	case "darwin":
		return []string{
			"/Library/PostgreSQL",
			filepath.Join(home, "Applications/Postgres.app/Contents/Versions"),
			"/usr/local/opt",
			"/opt/homebrew/opt",
		}
	case "linux":
		return []string{
			"/usr/lib/postgresql",
		}
	case "windows":
		var dirs []string
		if pf := os.Getenv("ProgramFiles"); pf != "" {
			dirs = append(dirs, filepath.Join(pf, "PostgreSQL"))
		}
		if pf := os.Getenv("ProgramFiles(x86)"); pf != "" {
			dirs = append(dirs, filepath.Join(pf, "PostgreSQL"))
		}
		return dirs
	default:
		return nil
	}
}

// scanForHighestVersion scan các folder con trong parentDir,
// sắp xếp theo version giảm dần, trả về đường dẫn bin của version cao nhất có pg_dump
func scanForHighestVersion(parentDir string) string {
	entries, err := os.ReadDir(parentDir)
	if err != nil {
		return ""
	}

	// Thu thập tên folder hợp lệ (có chứa số version)
	type folderVersion struct {
		name    string
		version []int
	}
	var folders []folderVersion

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		name := entry.Name()
		// Bỏ qua folder "latest" hoặc không có số
		if name == "latest" {
			continue
		}
		ver := parseVersion(name)
		if ver != nil {
			folders = append(folders, folderVersion{name: name, version: ver})
		}
	}

	// Sắp xếp version giảm dần (17 > 16 > 15...)
	sort.Slice(folders, func(i, j int) bool {
		return compareVersion(folders[i].version, folders[j].version) > 0
	})

	// Thêm "latest" vào đầu nếu có (Postgres.app dùng "latest" symlink)
	if _, err := os.Stat(filepath.Join(parentDir, "latest")); err == nil {
		folders = append([]folderVersion{{name: "latest", version: []int{999}}}, folders...)
	}

	// Duyệt theo version cao nhất, kiểm tra pg_dump
	for _, f := range folders {
		binDir := filepath.Join(parentDir, f.name, "bin")
		if _, err := resolveCommand("pg_dump", binDir); err == nil {
			return binDir
		}
	}

	// Nếu là /usr/local/opt hoặc /opt/homebrew/opt, thử check trực tiếp postgresql@XX/bin
	if strings.Contains(parentDir, "/opt") {
		for _, f := range folders {
			if strings.HasPrefix(f.name, "postgresql@") {
				binDir := filepath.Join(parentDir, f.name, "bin")
				if _, err := resolveCommand("pg_dump", binDir); err == nil {
					return binDir
				}
			}
		}
	}

	return ""
}

// parseVersion trích xuất các số từ tên folder, trả về slice int
// Ví dụ: "17" -> [17], "16.2" -> [16, 2], "PostgreSQL_15" -> [15]
func parseVersion(name string) []int {
	// Lấy tất cả chữ số liên tiếp trong tên
	var nums []int
	current := ""

	for _, ch := range name {
		if ch >= '0' && ch <= '9' {
			current += string(ch)
		} else {
			if current != "" {
				if n, err := strconv.Atoi(current); err == nil {
					nums = append(nums, n)
				}
				current = ""
			}
		}
	}
	if current != "" {
		if n, err := strconv.Atoi(current); err == nil {
			nums = append(nums, n)
		}
	}

	if len(nums) == 0 {
		return nil
	}
	return nums
}

// compareVersion so sánh 2 version, trả về >0 nếu a > b, <0 nếu a < b, 0 nếu bằng
func compareVersion(a, b []int) int {
	maxLen := len(a)
	if len(b) > maxLen {
		maxLen = len(b)
	}

	for i := 0; i < maxLen; i++ {
		var va, vb int
		if i < len(a) {
			va = a[i]
		}
		if i < len(b) {
			vb = b[i]
		}
		if va != vb {
			return va - vb
		}
	}
	return 0
}

// writeDetectResponse ghi JSON response cho detect endpoint
func writeDetectResponse(w http.ResponseWriter, success bool, path string, message string) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(DetectPgBinPathResponse{
		Success: success,
		Path:    path,
		Message: message,
	})
}
