package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject các router liên quan đến PostgreSQL Query Tool
// Backend chỉ có duy nhất 1 endpoint execute_query.
func InjectPostgreSQLRouter(app *http.ServeMux) {
	// CRUD cho connection group, connection, saved query
	service.GetPostgreSQLConnectionGroupController().RegisterRoutes(app)
	service.GetPostgreSQLConnectionController().RegisterRoutes(app)
	service.GetPostgreSQLSavedQueryController().RegisterRoutes(app)

	// Endpoint duy nhất để thực thi query (dùng cho cả query thường lẫn intellisense)
	app.HandleFunc("POST /postgresql/execute_query", service.ExecutePostgreSQLQueryHandler)

	// Endpoint cho các thao tác backup/clone database (JSON body)
	app.HandleFunc("POST /postgresql/database_ops", service.ExecutePostgreSQLDatabaseOpsHandler)

	// Endpoint cho restore database qua file upload (multipart/form-data)
	app.HandleFunc("POST /postgresql/database_ops_upload", service.ExecutePostgreSQLDatabaseOpsUploadHandler)

	// Endpoint tự động tìm đường dẫn PostgreSQL bin trên hệ thống
	app.HandleFunc("GET /postgresql/detect_bin_path", service.DetectPostgreSQLBinPathHandler)
}
