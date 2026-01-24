package main

import (
	"flag"
	"td_app/internal/banner"
	apiApp "td_core_service/external/api_app"
	configGlobal "td_core_service/external/config"
)

func main() {
	config := configGlobal.GetConfigGlobal()
	banner.PrintBanner()
	port := flag.Int("port", config.APIConfig.Port, "Port to run the server")
	trace := flag.Bool("trace", config.APIConfig.EnableTrace, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	apiApp.RunAPIApp(port, trace)
}
