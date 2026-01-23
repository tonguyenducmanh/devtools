package main

import (
	"flag"
	"td_api_service/external/api_app"
)

func main() {
	port := flag.Int("port", 7777, "Port to run the server")
	flag.Parse()
	var trace bool = false
	api_app.BuildAPIRoute(port, &trace)
}
