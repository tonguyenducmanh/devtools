package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject các router liên quan đến Mock API
func InjectMockAPIRouter(app *http.ServeMux) {
	// API cho mock item và group sử dụng base controller
	service.GetMockAPIController().RegisterRoutes(app)
	service.GetMockGroupController().RegisterRoutes(app)

	// Common
	app.HandleFunc("GET /mock_api/restart_mock_server", service.RestartMockServerFromClient)
	app.HandleFunc("GET /mock_api/get_base_url", service.GetMockServerBaseUrl)
}
