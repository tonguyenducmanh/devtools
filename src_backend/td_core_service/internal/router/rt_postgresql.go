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

	// Endpoint để test connection string
	app.HandleFunc("POST /postgresql/test_connection", service.TestPostgreSQLConnectionHandler)
}
