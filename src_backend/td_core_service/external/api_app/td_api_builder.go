package api_app

import (
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/middleware"
	"td_core_service/internal/router"
	"td_core_service/internal/service"
)

/**
 * khởi chạy api app
 */
func RunAPIApp(port *int, mockPort *int, trace *bool) {

	database.InitDatabase()

	app := http.NewServeMux()

	addRoute(app)

	// Khởi tạo mock API service trên port riêng và tự động start tất cả mock APIs
	service.InitMockAPIService(*mockPort)

	// Xâu chuỗi Middlewares: CORS -> Router
	finalHandler := middleware.ApplyCORS(app)

	addr := fmt.Sprintf(":%d", *port)
	fmt.Printf("Server API đang chạy tại http://localhost%s\n", addr)

	if err := http.ListenAndServe(addr, finalHandler); err != nil {
		panic(err)
	}
}

/**
 * thêm các route xử lý nghiệp vụ
 */
func addRoute(app *http.ServeMux) {
	// Inject router cho từng nghiệp vụ
	router.InjectCommonRouter(app)
	router.InjectExecAPIRouter(app)
	router.InjectMockAPIRouter(app)
}
