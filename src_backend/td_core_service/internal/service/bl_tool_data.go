package service

import (
	"net/http"

	_ "modernc.org/sqlite"
)

/**
 * Cấu trúc request thực thi SQL
 */
type SQLRequest struct {
	SQLText    string `json:"sql_text"`     // Câu lệnh SQL cần thực thi
	IsTempDB   bool   `json:"is_temp_db"`   // Thực thi trên DB tạm hay DB ứng dụng
	TempDBName string `json:"temp_db_name"` // Tên file DB tạm (nếu có)
}

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
