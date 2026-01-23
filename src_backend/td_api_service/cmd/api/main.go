package main

import (
	"flag"
	"fmt"
	"net/http"
	"td_api_service/internal/controller"
	"td_api_service/internal/middleware"
	"td_api_service/internal/service"
)

func main() {
	port := flag.Int("port", 7777, "Port to run the server")
	flag.Parse()

	// Khởi tạo router của thư viện chuẩn (Go 1.22+)
	mux := http.NewServeMux()

	apiSvc := service.NewAPITestService()
	apiCtrl := controller.NewAPIController(apiSvc)

	// Routing cực gọn
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, "Ok")
	})
	mux.HandleFunc("POST /exec", apiCtrl.Execute)

	// Xâu chuỗi Middlewares: Logger -> CORS -> Router
	finalHandler := middleware.Logger(middleware.CORS(mux))

	addr := fmt.Sprintf(":%d", *port)
	fmt.Printf("🚀 Server Native Go đang chạy tại %s\n", addr)

	if err := http.ListenAndServe(addr, finalHandler); err != nil {
		panic(err)
	}
}
