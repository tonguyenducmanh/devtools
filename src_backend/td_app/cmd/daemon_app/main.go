package main

import (
	"sync"
	"td_app/internal/banner"
	apiApp "td_app/internal/api_app"
	webApp "td_app/internal/web_app"
)

func main() {
	banner.PrintBanner()

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		apiApp.RunAPIApp()
	}()

	go func() {
		defer wg.Done()
		webApp.RunWebApp()
	}()

	wg.Wait() // chờ 2 service chạy xong
}
