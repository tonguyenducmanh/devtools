package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject các router liên quan đến thực thi API (gọi nối)
func InjectAPITestingRouter(app *http.ServeMux) {
	// Thực thi API
	app.HandleFunc("POST /api_test/exec", service.Execute)

	// Thực thi API đồng thời (goroutines)
	app.HandleFunc("POST /api_test/exec_parallel", service.ExecuteParallel)

	// CRUD API Testing và Group sử dụng base controller
	service.GetTestingAPIController().RegisterRoutes(app)
	service.GetTestingGroupController().RegisterRoutes(app)

	// CRUD API Testing ProMode và Group sử dụng base controller
	service.GetTestingProModeAPIController().RegisterRoutes(app)
	service.GetTestingProModeGroupController().RegisterRoutes(app)

	// Import Batch
	app.HandleFunc("POST /api_test/import_batch", service.BatchImportTestingData)
}
