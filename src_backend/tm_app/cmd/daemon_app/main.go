package main

import (
	"sync"
	apiApp "tm_app/internal/api_app"
	startUp "tm_app/internal/common"
	webApp "tm_app/internal/web_app"
)

// khởi chạy api app + web app
func main() {
	cfg := startUp.HandleStartUpLogic()
	var wg sync.WaitGroup

	// Khởi chạy API App
	if cfg.APIConfig.Enable {
		wg.Go(func() {
			apiApp.RunAPIApp()
		})
	}

	// Khởi chạy Web App
	if cfg.WebConfig.Enable {
		wg.Go(func() {
			webApp.RunWebApp()
		})
	}

	wg.Wait()
}
