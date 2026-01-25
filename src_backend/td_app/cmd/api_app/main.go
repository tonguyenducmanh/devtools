package main

import (
	"flag"
	"td_app/internal/banner"
	startUp "td_app/internal/common"
	apiApp "td_core_service/external/api_app"
)

/**
 * khởi chạy api app
 */
func main() {
	config := startUp.HandleStartUpLogic()
	banner.PrintBanner()
	port := flag.Int("port", config.APIConfig.Port, "Port to run the server")
	trace := flag.Bool("trace", config.APIConfig.EnableTrace, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	apiApp.RunAPIApp(port, trace)
}
