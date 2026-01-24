package web_app

import (
	webApp "td_core_service/external/web_app"
)

/**
 * Chạy web app
 */
func RunWebApp(webPort *int, webTrace *bool) {
	webApp.RunWebApp(webPort, webTrace)
}
