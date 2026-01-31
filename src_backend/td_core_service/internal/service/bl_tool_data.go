package service

import (
	"net/http"

	_ "modernc.org/sqlite"
)

/**
 * Thực thi câu lệnh SQL và trả về kết quả
 * @param w http.ResponseWriter
 * @param r *http.Request
 */
func ExecuteSQL(w http.ResponseWriter, r *http.Request) {
	// todo
}

/**
 * Upload file database SQLite tạm thời
 */
func UploadTempDB(w http.ResponseWriter, r *http.Request) {
	// todo
}

/**
 * Download database hiện tại của ứng dụng
 */
func DownloadCurrentDB(w http.ResponseWriter, r *http.Request) {
	// todo
}

/**
 * Lấy danh sách bảng và số lượng bản ghi
 */
func GetTablesInfo(w http.ResponseWriter, r *http.Request) {
	// todo
}
