package main

import (
	"flag"
	"sync"
	apiApp "td_app/internal/api_app"
	"td_app/internal/banner"
	webApp "td_app/internal/web_app"
)

func main() {
	banner.PrintBanner()
	apiPort := flag.Int("api-port", 7777, "Port to run the server")
	apiTrace := flag.Bool("api-trace", false, "Hiển thị log chi tiết cho Web server")
	webPort := flag.Int("web-port", 1403, "Port cho Web server")
	webTrace := flag.Bool("web-trace", false, "Hiển thị log chi tiết cho Web server")
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
