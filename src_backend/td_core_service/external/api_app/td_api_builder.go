package api_app

import (
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/middleware"
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
	app.HandleFunc("GET /", service.HeathCheck)
	app.HandleFunc("POST /exec", service.Execute)
	app.HandleFunc("POST /mock_api/create_mock", service.CreateMockAPI)
	app.HandleFunc("GET /mock_api/get_all_mock", service.GetAllMockAPI)
	app.HandleFunc("PUT /mock_api/update_mock", service.UpdateMockAPI)
	app.HandleFunc("DELETE /mock_api/delete_mock", service.RemoveMockAPI)

}
