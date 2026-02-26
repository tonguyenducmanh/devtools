package td_common

import (
	"fmt"
	"slices"
	"strings"
	"td_config"
	"time"
)

// hàm log common của toàn chương trình
func logData(message string, level string) {

	// kiểm tra có log level này mới cho dùng
	if !slices.Contains(td_config.GetConfigGlobal().LogConfig.LevelLog, level) {
		return
	}

	t := time.Now()
	sub_fix := "\n"
	if !strings.HasSuffix(message, sub_fix) {
		message += sub_fix
	}

	// log console
	if td_config.GetConfigGlobal().LogConfig.LogConsole {

		levelLogName := "Log " + level

		// Định dạng: Ngày/Tháng/Năm Giờ:Phút:Giây
		fmt.Printf("[%s] %s: %s", t.Format("02/01/2006 15:04:05"), levelLogName, message)
	}
}

func LogInfo(message string) {
	logData(message, "info")
}

func LogDebug(message string) {
	logData(message, "debug")
}

func LogError(message string) {
	logData(message, "error")
}

func LogException(message string) {
	logData(message, "exception")
}
