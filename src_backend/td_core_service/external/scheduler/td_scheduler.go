package scheduler

import (
	"time"

	"td_config"
	"td_core_service/td_common"
)

// StartScheduler khởi chạy các cron job nền (backup db + ghi log txt)
// theo chu kỳ cấu hình trong config (IntervalMinutes, mặc định 30 phút).
func StartScheduler() {
	cfg := td_config.GetConfigGlobal().CronJobConfig
	if !cfg.EnableBackup && !cfg.EnableLog {
		return
	}

	interval := time.Duration(cfg.IntervalMinutes) * time.Minute
	if interval <= 0 {
		interval = 30 * time.Minute
	}

	// Chạy ngầm trên goroutine riêng, không block main
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			runAllJobs()
		}
	}()

	td_common.LogInfo("Đã khởi chạy cron job với chu kỳ " + interval.String())
}

// runAllJobs thực thi toàn bộ cron job theo cấu hình
func runAllJobs() {
	cfg := td_config.GetConfigGlobal().CronJobConfig

	// Cron job 1: backup database ra folder riêng theo hệ điều hành
	if cfg.EnableBackup {
		if err := runBackup(); err != nil {
			td_common.LogError("Cron backup database thất bại: " + err.Error())
		}
	}

	// Cron job 2: ghi log đang buffer ra file txt định kỳ + dọn file log cũ
	if cfg.EnableLog {
		// Drain buffer log trong bộ nhớ → ghi xuống file txt (chỉ 1 goroutine ghi file)
		td_common.FlushLogFile()
		cleanupOldLogFiles()
	}

}
