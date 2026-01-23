package api_app

import (
	"fmt"
	"net/http"
	"td_api_service/internal/middleware"
	"td_api_service/internal/service"
)

/**
 * build ra api route
 */
func BuildAPIRoute(port *int, trace *bool) {
	app := http.NewServeMux()

	addRoute(app)

	// Xâu chuỗi Middlewares: CORS -> Router
	finalHandler := middleware.CORS(app)

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
	app.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Ok")
	})
	app.HandleFunc("POST /exec", service.GetTDAPITestService().Execute)
}
