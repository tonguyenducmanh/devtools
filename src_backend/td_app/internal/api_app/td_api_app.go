package api_app

import (
	apiApp "td_core_service/external/api_app"
)

/**
 * Chạy api app
 */
func RunAPIApp(apiPort *int, apiTrace *bool) {

	apiApp.RunAPIApp(apiPort, apiTrace)
}
