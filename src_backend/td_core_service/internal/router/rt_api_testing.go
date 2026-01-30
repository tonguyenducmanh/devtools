package router

import (
	"net/http"
	"td_core_service/internal/service"
)

/**
 * Inject các router liên quan đến thực thi API (gọi nối)
 */
func InjectAPITestingRouter(app *http.ServeMux) {
	// Thực thi API
	app.HandleFunc("POST /api_test/exec", service.Execute)

	// CRUD API Testing
	app.HandleFunc("GET /api_test/get_all_test", service.GetAllTestingAPIs)
	app.HandleFunc("POST /api_test/create_test", service.CreateTestingAPI)
	app.HandleFunc("PUT /api_test/update_test", service.UpdateTestingAPI)
	app.HandleFunc("DELETE /api_test/delete_test", service.DeleteTestingAPI)
	app.HandleFunc("POST /api_test/import_batch", service.BatchImportTestingData)

	// CRUD Group API Testing
	app.HandleFunc("GET /api_test/get_all_group", service.GetAllTestingGroups)
	app.HandleFunc("POST /api_test/create_group", service.CreateTestingGroup)
	app.HandleFunc("PUT /api_test/update_group", service.UpdateTestingGroup)
	app.HandleFunc("DELETE /api_test/delete_group", service.DeleteTestingGroup)
}
