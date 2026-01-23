package main

import (
	"fmt"
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

	daemon.RunDaemon()
	web_app.RunWebApp()
}
