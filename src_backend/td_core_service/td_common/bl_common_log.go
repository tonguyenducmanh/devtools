package td_common

import (
	"fmt"
	"slices"
	"strings"
	"td_config"
	"time"
)

// Định nghĩa mã màu ANSI
const (
	colorReset  = "\033[0m"
	colorInfo   = "\033[32m" // Xanh lá
	colorDebug  = "\033[36m" // Xanh dương lam (Cyan)
	colorError  = "\033[31m" // Đỏ
	colorExcept = "\033[35m" // Tím (Magenta)
)

func logData(message string, level string) {
	if !slices.Contains(td_config.GetConfigGlobal().LogConfig.LevelLog, level) {
		return
	}

	t := time.Now()
	sub_fix := "\n"
	if !strings.HasSuffix(message, sub_fix) {
		message += sub_fix
	}

	if td_config.GetConfigGlobal().LogConfig.LogConsole {
		levelLogName := "Log " + level

		// Chọn màu dựa trên level
		var colorCode string
		switch level {
		case "info":
			colorCode = colorInfo
		case "debug":
			colorCode = colorDebug
		case "error":
			colorCode = colorError
		case "exception":
			colorCode = colorExcept
		default:
			colorCode = colorReset
		}

		// Định dạng: Thêm mã màu vào trước và reset màu ở cuối dòng
		fmt.Printf("%s[%s] %s: %s%s", colorCode, t.Format("02/01/2006 15:04:05"), levelLogName, message, colorReset)
	}
}

func LogInfo(message string)      { logData(message, "info") }
func LogDebug(message string)     { logData(message, "debug") }
func LogError(message string)     { logData(message, "error") }
func LogException(message string) { logData(message, "exception") }
