package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	configGlobal "td_core_service/external/config"

	_ "github.com/mattn/go-sqlite3"
)

func executableDir() string {
	exe, err := os.Executable()
	if err != nil {
		panic(err)
	}
	return filepath.Dir(exe)
}
func dbPath() string {
	dir := executableDir()
	return filepath.Join(dir, configGlobal.GetConfigGlobal().DatabaseName)
}

/**
 * Lấy ra thông tin kết nối
 */
func GetConnectionDB() (*sql.DB, error) {
	// 1. Mở kết nối (Tên driver là "sqlite")
	db, err := sql.Open("sqlite3", dbPath())
	return db, err
}

/**
 * Khởi tạo database nếu chưa có
 */
func InitDatabase() {
	// 1. Mở kết nối (Tên driver là "sqlite")
	db, err := GetConnectionDB()
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	// 2. Tạo bảng
	sqlStmt := `
	CREATE TABLE IF NOT EXISTS td_api_mock (
		id TEXT PRIMARY KEY NOT NULL,
		request_name TEXT NOT NULL,
		group_name TEXT,
		method TEXT,
		end_point TEXT NOT NULL,
		body_text TEXT,
		response_text TEXT,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modififed_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmt)
	if err != nil {
		log.Printf("%q: %s\n", err, sqlStmt)
		return
	}
}
