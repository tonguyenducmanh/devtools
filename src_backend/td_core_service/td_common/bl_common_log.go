package td_common

import (
	"fmt"
	"runtime"
	"slices"
	"strings"
	"td_config"
	"time"

	"github.com/charmbracelet/lipgloss"
)

// Console logger - mỗi log gồm 2 dòng:
//   Dòng 1: thời gian │ level │ nơi gọi (file:line · function)
//   Dòng 2: nội dung message

var (
	styleTime    = lipgloss.NewStyle().Foreground(lipgloss.Color("#6272A4"))
	styleSep     = lipgloss.NewStyle().Foreground(lipgloss.Color("#44475A"))
	styleCaller  = lipgloss.NewStyle().Foreground(lipgloss.Color("#8BE9FD"))
	styleMessage = lipgloss.NewStyle().Foreground(lipgloss.Color("#F8F8F2"))

	styleLevelInfo    = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#50FA7B"))
	styleLevelDebug   = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#8BE9FD"))
	styleLevelError   = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#FF5555"))
	styleLevelExcept  = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#BD93F9"))
	styleLevelDefault = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#F1FA8C"))

	levelLabels = map[string]string{
		"info":      "INFO",
		"debug":     "DEBUG",
		"error":     "ERROR",
		"exception": "EXCPT",
	}
)

func logData(message string, level string) {
	if !slices.Contains(td_config.GetConfigGlobal().LogConfig.LevelLog, level) {
		return
	}

	message = strings.TrimSpace(message)
	if message == "" {
		return
	}

	if !td_config.GetConfigGlobal().LogConfig.LogConsole {
		return
	}

	// Lấy thông tin nơi gọi log
	callerPlain := ""
	if pc, file, line, ok := runtime.Caller(2); ok {
		shortFile := file
		if idx := strings.LastIndexByte(file, '/'); idx >= 0 {
			if idx2 := strings.LastIndexByte(file[:idx], '/'); idx2 >= 0 {
				shortFile = file[idx2+1:]
			} else {
				shortFile = file[idx+1:]
			}
		}
		funcName := runtime.FuncForPC(pc).Name()
		if idx := strings.LastIndexByte(funcName, '/'); idx >= 0 {
			funcName = funcName[idx+1:]
		}
		if idx := strings.LastIndexByte(funcName, '.'); idx >= 0 {
			funcName = funcName[idx+1:]
		}
		callerPlain = fmt.Sprintf("%s:%d · %s", shortFile, line, funcName)
	}

	levelPlain, ok := levelLabels[level]
	if !ok {
		levelPlain = strings.ToUpper(level)
	}

	timePlain := time.Now().Format("2006-01-02 15:04:05.000")

	var levelStyle lipgloss.Style
	switch level {
	case "info":
		levelStyle = styleLevelInfo
	case "debug":
		levelStyle = styleLevelDebug
	case "error":
		levelStyle = styleLevelError
	case "exception":
		levelStyle = styleLevelExcept
	default:
		levelStyle = styleLevelDefault
	}

	sep := styleSep.Render("│")

	// Dòng 1: thời gian │ level │ nơi gọi
	headerLine := fmt.Sprintf(
		"%s %s %s %s %s",
		styleTime.Render(timePlain), sep,
		levelStyle.Render(levelPlain), sep,
		styleCaller.Render(callerPlain),
	)

	// Dòng 2: nội dung message, in nguyên vẹn, không wrap
	messageLine := styleMessage.Render(message)

	fmt.Printf("%s\n%s\n\n", headerLine, messageLine)
}

func LogInfo(message string)      { logData(message, "info") }
func LogDebug(message string)     { logData(message, "debug") }
func LogError(message string)     { logData(message, "error") }
func LogException(message string) { logData(message, "exception") }
