package td_common

import (
	"fmt"
	"slices"
	"strings"
	"td_config"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"time"
)

// hàm log common của toàn chương trình
func LogData(message string, level string) {

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

	// log vào db
	if td_config.GetConfigGlobal().LogConfig.LogDatabase {
		dataLogDB := model.TDLogApp{
			ID: GenUUID(), Level: level, LogData: message,
		}
		database.CreateLogApp(&dataLogDB)
	}
}

func LogInfo(message string) {
	LogData(message, "info")
}

func LogDebug(message string) {
	LogData(message, "debug")
}

func LogError(message string) {
	LogData(message, "error")
}

func LogException(message string) {
	LogData(message, "exception")
}
