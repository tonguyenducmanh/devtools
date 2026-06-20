package database

import (
	"fmt"
	"log"
	"td_core_service/td_common"

	_ "modernc.org/sqlite"
)

// Khởi tạo database nếu chưa có
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
		group_id TEXT,
		method TEXT,
		end_point TEXT NOT NULL,
		body_text TEXT,
		response_text TEXT,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmt)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmt))
		return
	}

	// 3. Tạo bảng nhóm mock api
	sqlStmtGroup := `
	CREATE TABLE IF NOT EXISTS td_api_mock_group (
		id TEXT PRIMARY KEY NOT NULL,
		name TEXT NOT NULL,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmtGroup)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmtGroup))
		return
	}

	// 4. Tạo bảng api testing
	sqlStmtTesting := `
	CREATE TABLE IF NOT EXISTS td_api_testing (
		id TEXT PRIMARY KEY NOT NULL,
		request_name TEXT NOT NULL,
		group_id TEXT,
		method TEXT,
		end_point TEXT NOT NULL,
		headers_text TEXT,
		body_text TEXT,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmtTesting)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmtTesting))
		return
	}

	sqlStmtTestingLog := `
	CREATE TABLE IF NOT EXISTS td_api_testing_log (
		id TEXT PRIMARY KEY NOT NULL,
		api_url TEXT NOT NULL,
		method TEXT,
		headers_text TEXT,
		body_text TEXT,
		response_text TEXT,
		status_code INTERGER,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmtTestingLog)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmtTestingLog))
		return
	}

	// 5. Tạo bảng nhóm api testing
	sqlStmtTestingGroup := `
	CREATE TABLE IF NOT EXISTS td_api_testing_group (
		id TEXT PRIMARY KEY NOT NULL,
		name TEXT NOT NULL,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmtTestingGroup)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmtTestingGroup))
		return
	}

	// 6. Tạo bảng RDP connections
	sqlStmtRDPConnection := `
	CREATE TABLE IF NOT EXISTS td_rdp_connection (
		id TEXT PRIMARY KEY NOT NULL,
		connection_name TEXT NOT NULL,
		host TEXT NOT NULL,
		username TEXT,
		password TEXT,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmtRDPConnection)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmtRDPConnection))
		return
	}

	// 7. Tạo bảng PostgreSQL connections
	sqlStmtPostgreSQLConnection := `
	CREATE TABLE IF NOT EXISTS td_postgresql_connection (
		id TEXT PRIMARY KEY NOT NULL,
		connection_name TEXT NOT NULL,
		connection_string TEXT NOT NULL,
		usernconnect_type INTERGER NOT NULL DEFAULT 0,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmtPostgreSQLConnection)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmtPostgreSQLConnection))
		return
	}

	// 8. Tạo bảng nhóm kết nối postgresql
	sqlStmtPostgreSQLGroupConnection := `
	CREATE TABLE IF NOT EXISTS td_postgresql_connection_group (
		id TEXT PRIMARY KEY NOT NULL,
		name TEXT NOT NULL,
		created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(sqlStmtPostgreSQLGroupConnection)
	if err != nil {
		td_common.LogError(fmt.Sprintf("%q: %s\n", err, sqlStmtPostgreSQLGroupConnection))
		return
	}
}
