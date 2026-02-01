package web_app

import "td_core_service/internal/web"

/**
 * Chạy web app
 */
func RunWebApp(port *int, trace *bool) {
	web.RunWebApp(port, trace)
}
