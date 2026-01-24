package main

import (
	"flag"
	apiApp "td_core_service/external/api_app"
)

func main() {
	port := flag.Int("port", 7777, "Port to run the server")
	trace := flag.Bool("trace", false, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	apiApp.BuildAPIRoute(port, trace)
}
