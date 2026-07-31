package td_common

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"sync"
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

// ── File logger: ghi log ra file txt ĐỊNH KỲ (không ghi trực tiếp mỗi lần gọi) ──
// Lý do: nếu mỗi lần gọi log lại mở file ghi ngay thì nhiều goroutine sẽ ghi đồng thời
// vào cùng 1 file → khó kiểm soát. Thay vào đó chỉ append vào buffer (có mutex),
// cron job (goroutine duy nhất) sẽ drain buffer và ghi xuống file định kỳ.

var (
	// buffer chứa các dòng log chưa ghi ra file
	logBufferMu sync.Mutex
	logBuffer   []string

	// khoá riêng cho việc ghi file → đảm bảo chỉ 1 writer tại 1 thời điểm
	logFileMu sync.Mutex

	// ngưỡng an toàn: nếu buffer vượt quá số dòng này sẽ flush ngay
	// (tránh tốn bộ nhớ khi cron chưa kịp chạy)
	maxLogBufferLines = 5000
)

func logData(message string, level string) {
	if !slices.Contains(td_config.GetConfigGlobal().LogConfig.LevelLog, level) {
		return
	}

	message = strings.TrimSpace(message)
	if message == "" {
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

	// Buffer log lại để cron job ghi xuống file txt định kỳ
	// (không mở file ghi ngay tại đây để tránh ghi đa luồng đồng thời)
	if td_config.GetConfigGlobal().LogConfig.LogFile {
		line := fmt.Sprintf("%s │ %s │ %s\n%s\n\n", timePlain, levelPlain, callerPlain, message)
		appendLogBuffer(line)
	}

	if !td_config.GetConfigGlobal().LogConfig.LogConsole {
		return
	}

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

// appendLogBuffer thêm 1 dòng log vào buffer trong bộ nhớ (thread-safe).
// Nếu buffer vượt ngưỡng an toàn thì flush ngay để tránh tốn bộ nhớ.
func appendLogBuffer(line string) {
	logBufferMu.Lock()
	logBuffer = append(logBuffer, line)
	overflow := len(logBuffer) >= maxLogBufferLines
	logBufferMu.Unlock()

	if overflow {
		FlushLogFile()
	}
}

// FlushLogFile drain toàn bộ log trong buffer và ghi xuống file txt theo ngày.
// Được gọi định kỳ bởi cron job. Thread-safe: buffer được drain dưới mutex,
// còn việc ghi file được nối tiếp dưới logFileMu (chỉ 1 writer).
func FlushLogFile() {
	if td_config.GetConfigGlobal().LogConfig.LogFile {
		logBufferMu.Lock()
		if len(logBuffer) == 0 {
			logBufferMu.Unlock()
			return
		}
		lines := logBuffer
		logBuffer = nil
		logBufferMu.Unlock()

		writeLogLines(lines)
	}
}

// writeLogLines ghi các dòng log (plain text, không màu ANSI) vào file txt,
// mỗi ngày 1 file: logs/devtool_log_<yyyy-MM-dd>.txt
func writeLogLines(lines []string) {
	logFileMu.Lock()
	defer logFileMu.Unlock()

	if len(lines) == 0 {
		return
	}

	dir := logFileDir()
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return
	}

	fileName := "devtool_log_" + time.Now().Format("2006-01-02") + ".txt"
	path := filepath.Join(dir, fileName)

	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	for _, line := range lines {
		_, _ = f.WriteString(line)
	}
}

// logFileDir trả về thư mục logs nằm cạnh file thực thi của app
func logFileDir() string {
	exe, err := os.Executable()
	if err != nil {
		return "logs"
	}
	return filepath.Join(filepath.Dir(exe), "logs")
}
