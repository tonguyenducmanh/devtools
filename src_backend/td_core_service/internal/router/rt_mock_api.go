package router

import (
	"net/http"
	"td_core_service/internal/service"
)

/**
 * Inject các router liên quan đến Mock API
 */
func InjectMockAPIRouter(app *http.ServeMux) {
	// API cho mock item
	app.HandleFunc("POST /mock_api/create_mock", service.CreateMockAPI)
	app.HandleFunc("GET /mock_api/get_all_mock", service.GetAllMockAPI)
	app.HandleFunc("PUT /mock_api/update_mock", service.UpdateMockAPI)
	app.HandleFunc("DELETE /mock_api/delete_mock", service.RemoveMockAPI)

	// API cho mock group
	app.HandleFunc("GET /mock_api/get_all_group", service.GetAllMockGroup)
	app.HandleFunc("POST /mock_api/create_group", service.CreateMockGroup)
	app.HandleFunc("DELETE /mock_api/delete_group", service.RemoveMockGroup)
}
