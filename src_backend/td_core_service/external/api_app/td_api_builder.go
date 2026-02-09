package api_app

import (
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/middleware"
	"td_core_service/internal/router"
	"td_core_service/internal/service"
	"td_core_service/td_common"
)

// khởi chạy api app
func RunAPIApp(port *int, mockPort *int, trace *bool) {

	database.InitDatabase()

	app := http.NewServeMux()

	addRoute(app)

	// Khởi tạo mock API service trên port riêng và tự động start tất cả mock APIs
	service.InitMockAPIService(*mockPort)

	// Xâu chuỗi Middlewares: CORS -> Router
	finalHandler := middleware.ApplyCORS(app)

	addr := td_common.BuildRunningAddressServer("Server Agent API", port)

	if err := http.ListenAndServe(addr, finalHandler); err != nil {
		panic(err)
	}
}

// thêm các route xử lý nghiệp vụ
func addRoute(app *http.ServeMux) {
	// Inject router cho từng nghiệp vụ
	router.InjectCommonRouter(app)
	router.InjectAPITestingRouter(app)
	router.InjectMockAPIRouter(app)
	router.InjectAppDataMiner(app)
}
