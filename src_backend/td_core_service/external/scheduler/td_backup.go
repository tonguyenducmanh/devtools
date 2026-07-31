package scheduler

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
	"time"

	"td_config"
	"td_core_service/internal/database"
	"td_core_service/td_common"
)

// osFolderName trả về tên thư mục backup riêng theo từng hệ điều hành
func osFolderName() string {
	switch runtime.GOOS {
	case "darwin":
		return "macos"
	case "windows":
		return "windows"
	case "linux":
		return "linux"
	default:
		return runtime.GOOS
	}
}

// backupDir trả về thư mục backup theo hệ điều hành: <exe>/backup/<os>/
func backupDir() string {
	return filepath.Join(database.ExecutableDir(), "backup", osFolderName())
}

// dbBaseName trả về tên file db không đuôi mở rộng, vd: "dev_tool"
func dbBaseName() string {
	name := filepath.Base(database.GetDBPath())
	return strings.TrimSuffix(name, filepath.Ext(name))
}

// runBackup tạo file backup nhất quán của database đang dùng.
// Dùng VACUUM INTO để snapshot toàn bộ dữ liệu (kể cả WAL) ra file backup.
func runBackup() error {
	dir := backupDir()
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return err
	}

	db, err := database.GetConnectionDB()
	if err != nil {
		return err
	}

	fileName := fmt.Sprintf("%s_backup_%s.db", dbBaseName(), time.Now().Format("2006-01-02_15-04-05"))
	destPath := filepath.Join(dir, fileName)

	// VACUUM INTO không ghi đè file đã tồn tại → xóa nếu có (phòng trường hợp trùng tên)
	if _, err := os.Stat(destPath); err == nil {
		_ = os.Remove(destPath)
	}

	// Escape ký tự nháy đơn trong đường dẫn trước khi nhúng vào SQL
	quoted := strings.ReplaceAll(destPath, "'", "''")
	if _, err := db.Exec("VACUUM INTO '" + quoted + "'"); err != nil {
		return err
	}

	td_common.LogInfo(fmt.Sprintf("Đã backup database thành công: %s", destPath))

	cleanupOldBackups()
	return nil
}

// cleanupOldBackups chỉ giữ KeepBackupCount bản backup mới nhất
func cleanupOldBackups() {
	keep := td_config.GetConfigGlobal().CronJobConfig.KeepBackupCount
	if keep <= 0 {
		return
	}

	entries, err := os.ReadDir(backupDir())
	if err != nil {
		return
	}

	var backups []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".db") {
			backups = append(backups, e.Name())
		}
	}

	// Tên file có timestamp định dạng đồng nhất → sort lexicographic = sort theo thời gian
	sort.Strings(backups)

	for i := 0; i < len(backups)-keep; i++ {
		_ = os.Remove(filepath.Join(backupDir(), backups[i]))
	}
}
