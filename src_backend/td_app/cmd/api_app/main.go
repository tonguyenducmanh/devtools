package main

import (
	"flag"
	"td_app/internal/banner"
	apiApp "td_core_service/external/api_app"
)

func main() {
	banner.PrintBanner()
	port := flag.Int("port", 7777, "Port to run the server")
	trace := flag.Bool("trace", false, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	apiApp.RunAPIApp(port, trace)
}
