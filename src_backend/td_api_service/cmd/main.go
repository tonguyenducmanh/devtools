package main

import (
	"flag"
	"td_api_service/external/api_app"
)

func main() {
	port := flag.Int("port", 7777, "Port to run the server")
	trace := flag.Bool("api-trace", false, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	api_app.BuildAPIRoute(port, trace)
}
