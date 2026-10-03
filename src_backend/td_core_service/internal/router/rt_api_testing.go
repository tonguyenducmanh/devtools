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

	// CRUD API Testing + Group và ProMode + Group, kèm endpoint get_tree trả về cây đã gom sẵn
	service.GetTestingAPICollection().RegisterRoutes(app)
	service.GetTestingProModeAPICollection().RegisterRoutes(app)

	// Import Batch
	app.HandleFunc("POST /api_test/import_batch", service.BatchImportTestingData)
	app.HandleFunc("POST /api_test/import_pro_mode_batch", service.BatchImportProModeTestingData)
}
