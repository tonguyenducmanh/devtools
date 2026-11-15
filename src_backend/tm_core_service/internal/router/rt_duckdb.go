// Package router đăng ký tất cả các route DuckDB Query Tool.

package router

import (
	"net/http"
	"tm_core_service/internal/service/duckdb"
)

// InjectDuckDBRouter đăng ký tất cả router liên quan đến DuckDB Query Tool.
func InjectDuckDBRouter(app *http.ServeMux) {
	// Thực thi SQL query trên session DuckDB in-memory
	app.HandleFunc("POST /duckdb/execute_query", duckdb.ExecuteDuckDBQueryHandler)

	// Upload file (Excel/CSV/Parquet/JSON) vào session DuckDB
	app.HandleFunc("POST /duckdb/upload_file", duckdb.UploadDuckDBFileHandler)

	// Lấy danh sách file đã nạp trong session
	app.HandleFunc("GET /duckdb/session_files", duckdb.GetSessionFilesHandler)

	// Xoá 1 file/view khỏi session
	app.HandleFunc("POST /duckdb/drop_file", duckdb.DropDuckDBFileHandler)

	// Xoá tất cả file trong session
	app.HandleFunc("POST /duckdb/drop_all_files", duckdb.DropAllDuckDBFilesHandler)

	// Xoá toàn bộ session (giải phóng memory)
	app.HandleFunc("POST /duckdb/drop_session", duckdb.DropDuckDBSessionHandler)
}
