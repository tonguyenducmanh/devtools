package api_app

import (
	"net/http"
	configGlobal "td_core_service/external/config"
	"td_core_service/internal/database"
	"td_core_service/internal/middleware"
	"td_core_service/internal/router"
	"td_core_service/internal/service"
	"td_core_service/td_common"
)

// build dữ liệu database
func InitDatabase() {
	database.InitDatabase()
}

// khởi chạy api app
func RunAPIApp() {
	port := configGlobal.GetConfigGlobal().APIConfig.Port
	mockPort := configGlobal.GetConfigGlobal().MockAPIConfig.Port

	app := http.NewServeMux()

	addRoute(app)

	// Khởi tạo mock API service trên port riêng và tự động start tất cả mock APIs
	service.InitMockAPIService(mockPort)

	// inject 1 số kịch bản chung toàn chương tình vào handler
	var handler = td_common.BuildHanlderAPICommon(app)

	// Xâu chuỗi Middlewares: CORS -> Router
	finalHandler := middleware.ApplyCORS(handler)

	addr := td_common.BuildRunningAddressServer("Server Agent API", &port)

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
