package scheduler

import (
	"os"
	"path/filepath"
	"strings"
	"time"

	"td_config"
	"td_core_service/internal/database"
)

// logDir trả về thư mục chứa file log txt: <exe>/logs/
func logDir() string {
	return filepath.Join(database.ExecutableDir(), "logs")
}

// cleanupOldLogFiles xóa các file log txt cũ hơn KeepLogDays ngày.
// File log txt hàng ngày được ghi trực tiếp bởi td_common (logData),
// cron này chỉ chịu trách nhiệm dọn dẹp các file cũ.
func cleanupOldLogFiles() {
	keepDays := td_config.GetConfigGlobal().CronJobConfig.KeepLogDays
	if keepDays <= 0 {
		return
	}

	entries, err := os.ReadDir(logDir())
	if err != nil {
		return
	}

	threshold := time.Now().AddDate(0, 0, -keepDays)

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".txt") {
			continue
		}

		info, err := e.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(threshold) {
			_ = os.Remove(filepath.Join(logDir(), e.Name()))
		}
	}
}
