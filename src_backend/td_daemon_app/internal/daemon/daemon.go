package daemon

import (
	"flag"
	"td_api_service/external/api_app"
)

/**
 * Chạy daemon app
 */
func RunDaemon() {
	api_port := flag.Int("api-port", 7777, "Port to run the server")
	trace := flag.Bool("web-trace", false, "Hiển thị log chi tiết cho Web server")

	flag.Parse()
	api_app.BuildAPIRoute(api_port, trace)
}
