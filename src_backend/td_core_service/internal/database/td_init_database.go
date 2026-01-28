package database

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite" // Đăng ký driver sqlite
)

func InitDatabase() {
	// 1. Mở kết nối (Tên driver là "sqlite")
	db, err := sql.Open("sqlite", "tool_tomanh.db")
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
