package main

import (
	"flag"
	startUp "td_app/internal/common"
	apiApp "td_core_service/external/api_app"
)

/**
 * khởi chạy api app
 */
func main() {
	config := startUp.HandleStartUpLogic()
	port := flag.Int("port", config.APIConfig.Port, "Port to run the server")
	mockPort := flag.Int("mock_port", config.MockAPIConfig.Port, "Port to run the mock API server")
	trace := flag.Bool("trace", config.APIConfig.EnableTrace, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	apiApp.RunAPIApp(port, mockPort, trace)
}
