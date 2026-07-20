package router

import (
	"net/http"
	"td_core_service/internal/service/postgresql"
)

// InjectPostgreSQLRouter đăng ký tất cả router liên quan đến PostgreSQL
func InjectPostgreSQLRouter(app *http.ServeMux) {
	// CRUD cho connection group, connection, saved query
	postgresql.GetPostgreSQLConnectionGroupController().RegisterRoutes(app)
	postgresql.GetPostgreSQLConnectionController().RegisterRoutes(app)
	postgresql.GetPostgreSQLSavedQueryController().RegisterRoutes(app)

	// Endpoint thực thi query
	app.HandleFunc("POST /postgresql/execute_query", postgresql.ExecutePostgreSQLQueryHandler)

	// Endpoint cho các thao tác backup/clone database (JSON body)
	app.HandleFunc("POST /postgresql/database_ops", postgresql.ExecutePostgreSQLDatabaseOpsHandler)

	// Endpoint cho restore database qua file upload (multipart/form-data)
	app.HandleFunc("POST /postgresql/database_ops_upload", postgresql.ExecutePostgreSQLDatabaseOpsUploadHandler)

	// Endpoint tự động tìm đường dẫn PostgreSQL bin trên hệ thống
	app.HandleFunc("GET /postgresql/detect_bin_path", postgresql.DetectPostgreSQLBinPathHandler)
}
