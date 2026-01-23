package main

import (
	"fmt"
	"sync"
	"td_daemon_app/internal/daemon"
	"td_daemon_app/internal/web_app"
)

const banner = `
  ______ ____  ____  __       ______ ____  __  ___ ___     _   __ __  __
 /_  __// __ \/ __ \/ /      /_  __// __ \/  |/  //   |   / | / // / / /
  / /  / / / / / / / /        / /  / / / / /|_/ // /| |  /  |/ // /_/ / 
 / /  / /_/ / /_/ / /___     / /  / /_/ / /  / // ___ | / /|  // __  /  
/_/   \____/\____/_____/    /_/   \____/_/  /_//_/  |_|/_/ |_//_/ /_/   

From TDManh with luv

`

func main() {
	fmt.Print(banner)

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		daemon.RunDaemon()
	}()

	go func() {
		defer wg.Done()
		web_app.RunWebApp()
	}()

	wg.Wait() // chờ 2 service chạy xong
}
