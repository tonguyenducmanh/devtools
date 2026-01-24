package daemon

import (
	"flag"
	apiApp "td_core_service/external/api_app"
)

/**
 * Chạy daemon app
 */
func RunDaemon() {
	api_port := flag.Int("api-port", 7777, "Port to run the server")
	trace := flag.Bool("api-trace", false, "Hiển thị log chi tiết cho Web server")

	flag.Parse()
	apiApp.RunAPIApp(api_port, trace)
}
