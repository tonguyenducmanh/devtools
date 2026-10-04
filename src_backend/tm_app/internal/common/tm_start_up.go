package common

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"tm_app/internal/banner"
	"tm_config"
	apiApp "tm_core_service/external/api_app"
	"tm_core_service/tm_common"
)

// Xử lý các kịch bản cần thiết khi run app nói chung
func HandleStartUpLogic() *tm_config.TMCenterConfig {
	centerConfig := tm_config.GetConfigGlobal()
	banner.PrintBanner()
	apiApp.InitDatabase()

	HandleGracefulShutdown()

	return centerConfig
}

// HandleGracefulShutdown lắng nghe tín hiệu đóng app và log trước khi thoát.
func HandleGracefulShutdown() {
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt, syscall.SIGTERM)

	go func() {
		sig := <-ch
		tm_common.LogInfo(fmt.Sprintf("Nhận tín hiệu đóng app (%v)", sig))
		os.Exit(0)
	}()
}
