package td_common

import (
	"fmt"
	"slices"
	"strings"
	"td_config"
	"time"

	"github.com/charmbracelet/lipgloss"
)

var (
	// Style thời gian gọn gàng (màu xám xanh thanh lịch)
	styleTime = lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))

	// Base tag cho level log
	baseTag = lipgloss.NewStyle().Bold(true).Padding(0, 1).Foreground(lipgloss.Color("#FFFFFF"))

	// Cố định chiều rộng tag là 7 ký tự để thẳng hàng tuyệt đối
	styleInfo   = baseTag.Width(7).Background(lipgloss.Color("#50FA7B")).Foreground(lipgloss.Color("#282A36"))
	styleDebug  = baseTag.Width(7).Background(lipgloss.Color("#8BE9FD")).Foreground(lipgloss.Color("#282A36"))
	styleError  = baseTag.Width(7).Background(lipgloss.Color("#FF5555"))
	styleExcept = baseTag.Width(7).Background(lipgloss.Color("#BD93F9"))

	styleMessage = lipgloss.NewStyle().Foreground(lipgloss.Color("#F8F8F2"))
)

func logData(message string, level string) {
	if !slices.Contains(td_config.GetConfigGlobal().LogConfig.LevelLog, level) {
		return
	}

	// Làm sạch tin nhắn, loại bỏ khoảng trắng thừa ở đầu/cuối
	message = strings.TrimSpace(message)
	if message == "" {
		return
	}

	t := time.Now()

	if td_config.GetConfigGlobal().LogConfig.LogConsole {
		levelLogName := strings.ToUpper(level)

		var styledLevel string
		switch level {
		case "info":
			styledLevel = styleInfo.Render(levelLogName)
		case "debug":
			styledLevel = styleDebug.Render(levelLogName)
		case "error":
			styledLevel = styleError.Render(levelLogName)
		case "exception":
			styledLevel = styleExcept.Render(levelLogName)
		default:
			styledLevel = baseTag.Width(7).Background(lipgloss.Color("#44475A")).Render(levelLogName)
		}

		// Đổi ở đây: Hiển thị đầy đủ Ngày/Tháng/Năm Giờ:Phút:Giây.Mili-giây
		formattedTime := styleTime.Render(fmt.Sprintf("[%s]", t.Format("02/01/2006 15:04:05.000")))
		styledMessage := styleMessage.Render(message)

		// Xuất ra màn hình thẳng hàng tăm tắp
		fmt.Printf("%s  %s  %s\n", formattedTime, styledLevel, styledMessage)
	}
}

func LogInfo(message string)      { logData(message, "info") }
func LogDebug(message string)     { logData(message, "debug") }
func LogError(message string)     { logData(message, "error") }
func LogException(message string) { logData(message, "exception") }
