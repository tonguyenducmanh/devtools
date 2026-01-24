package web_app

import (
	"flag"
	webApp "td_core_service/external/web_app"
)

/**
 * Chạy web app
 */
func RunWebApp() {
	// Web flags
	port := flag.Int("web-port", 8080, "Port cho Web server")
	trace := flag.Bool("web-trace", false, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	webApp.RunWebApp(port, trace)
}
