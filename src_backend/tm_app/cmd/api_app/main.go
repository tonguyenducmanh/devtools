package main

import (
	startUp "tm_app/internal/common"
	apiApp "tm_core_service/external/api_app"
)

// khởi chạy api app
func main() {
	startUp.HandleStartUpLogic()
	apiApp.RunAPIApp()
}
