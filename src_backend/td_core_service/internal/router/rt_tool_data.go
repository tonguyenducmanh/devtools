package router

import (
	"net/http"
	"td_core_service/internal/service"
)

/**
 * Inject các router liên quan đến xử lý dữ liệu database
 * @param app *http.ServeMux
 */
func InjectToolDataRouter(app *http.ServeMux) {
	// API thực thi câu lệnh SQL
	app.HandleFunc("POST /tool_data/execute_sql", service.ExecuteSQL)

	// API upload file SQLite tạm thời
	app.HandleFunc("POST /tool_data/upload_db", service.UploadTempDB)

	// API download file database ứng dụng
	app.HandleFunc("GET /tool_data/download_db", service.DownloadCurrentDB)

	// API lấy danh sách bảng và số lượng bản ghi
	app.HandleFunc("GET /tool_data/get_tables", service.GetTablesInfo)
}
