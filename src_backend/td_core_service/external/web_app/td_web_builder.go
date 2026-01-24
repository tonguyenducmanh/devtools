package web_app

import "td_core_service/internal/service"

/**
 * Chạy web app
 */
func RunWebApp(port *int, trace *bool) {
	service.RunWebApp(port, trace)
}
