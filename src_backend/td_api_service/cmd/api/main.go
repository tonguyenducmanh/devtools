package main

import (
	"flag"
	"td_api_service/external"
)

func main() {
	port := flag.Int("port", 7777, "Port to run the server")
	flag.Parse()
	external.BuildAPIRoute(port)
}
