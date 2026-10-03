package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject các router liên quan đến Mock API
func InjectMockAPIRouter(app *http.ServeMux) {
	// CRUD cho mock group + mock item, kèm endpoint get_tree trả về cây đã gom sẵn
	service.GetMockAPICollection().RegisterRoutes(app)

	// Common
	app.HandleFunc("GET /mock_api/restart_mock_server", service.RestartMockServerFromClient)
	app.HandleFunc("GET /mock_api/get_base_url", service.GetMockServerBaseUrl)

	// Import batch
	app.HandleFunc("POST /mock_api/import_batch", service.BatchImportMockAPIs)
}
