package main

import (
	"flag"
	"sync"
	apiApp "td_app/internal/api_app"
	startUp "td_app/internal/common"
	webApp "td_app/internal/web_app"
)

/**
 * khởi chạy api app + web app
 */
func main() {
	config := startUp.HandleStartUpLogic()
	apiPort := flag.Int("api-port", config.APIConfig.Port, "Port to run the server")
	apiTrace := flag.Bool("api-trace", config.APIConfig.EnableTrace, "Hiển thị log chi tiết cho Web server")
	webPort := flag.Int("web-port", config.WebConfig.Port, "Port cho Web server")
	webTrace := flag.Bool("web-trace", config.WebConfig.EnableTrace, "Hiển thị log chi tiết cho Web server")
	flag.Parse()

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		apiApp.RunAPIApp(apiPort, apiTrace)
	}()

	go func() {
		defer wg.Done()
		webApp.RunWebApp(webPort, webTrace)
	}()

	wg.Wait() // chờ 2 service chạy xong
}
