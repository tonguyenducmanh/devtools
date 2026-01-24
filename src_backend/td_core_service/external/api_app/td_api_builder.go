package api_app

import (
	"fmt"
	"net/http"
	"td_core_service/internal/middleware"
	"td_core_service/internal/service"
)

/**
 * khởi chạy api app
 */
func RunAPIApp(port *int, trace *bool) {
	app := http.NewServeMux()

	addRoute(app)

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
}
