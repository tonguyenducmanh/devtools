package daemon

import (
	"flag"
	"fmt"
	"td_api_service/external/api_app"
)

const banner = `
  ______ ____  ____  __       ______ ____  __  ___ ___     _   __ __  __
 /_  __// __ \/ __ \/ /      /_  __// __ \/  |/  //   |   / | / // / / /
  / /  / / / / / / / /        / /  / / / / /|_/ // /| |  /  |/ // /_/ / 
 / /  / /_/ / /_/ / /___     / /  / /_/ / /  / // ___ | / /|  // __  /  
/_/   \____/\____/_____/    /_/   \____/_/  /_//_/  |_|/_/ |_//_/ /_/   

From TDManh with luv

`

/**
 * Chạy daemon app
 */
func RunDaemon() {
	fmt.Print(banner)
	// Logic ứng dụng của bạn ở đây
	port := flag.Int("port", 7777, "Port to run the server")
	flag.Parse()
	api_app.BuildAPIRoute(port)
}
