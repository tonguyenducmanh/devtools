package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"td_api_service/internal/controller"
	"td_api_service/internal/middleware"
	"td_api_service/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// Đọc tham số port (tương đương minimist)
	port := flag.Int("port", 7777, "Port to run the server")
	flag.Parse()

	r := gin.Default()

	r.Use(middleware.CORSMiddleware())

	// Khởi tạo các lớp (Dependency Injection thủ công)
	apiSvc := service.NewAPITestService()
	apiCtrl := controller.NewAPIController(apiSvc)

	// Routes
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Ok")
	})

	r.POST("/exec", apiCtrl.Execute)

	// Run
	addr := fmt.Sprintf("0.0.0.0:%d", *port)
	log.Printf("API đang chạy tại http://%s", addr)
	r.Run(addr)
}
