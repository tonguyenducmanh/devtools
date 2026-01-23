package api_app

import (
	"fmt"
	"net/http"
	"td_api_service/internal/controller"
	"td_api_service/internal/middleware"
	"td_api_service/internal/service"
)

/**
 * build ra api route
 */
func BuildAPIRoute(port *int, trace *bool) {
	mux := http.NewServeMux()

	apiSvc := service.GetTDAPITestService()
	apiCtrl := controller.NewAPIController(apiSvc, trace)

	addRoute(mux, apiCtrl)

	// Xâu chuỗi Middlewares: CORS -> Router
	finalHandler := middleware.CORS(mux)

	addr := fmt.Sprintf(":%d", *port)
	fmt.Printf("Server API đang chạy tại http://localhost%s\n", addr)

	if err := http.ListenAndServe(addr, finalHandler); err != nil {
		panic(err)
	}
}

/**
 * thêm các route xử lý nghiệp vụ
 */
func addRoute(mux *http.ServeMux, apiCtrl *controller.APIController) {
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Ok")
	})
	mux.HandleFunc("POST /exec", apiCtrl.Execute)
}
