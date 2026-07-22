package database

import (
	"fmt"
	"log"
	"td_core_service/td_common"

	_ "modernc.org/sqlite"
)

func init() {
}

// Khởi tạo database nếu chưa có
func InitDatabase() {
	db, err := GetConnectionDB()
	if err != nil {
		log.Fatal(err)
	}

	// Danh sách các script tạo bảng (CREATE TABLE IF NOT EXISTS)
	createScripts := []string{
		// td_api_mock
		`CREATE TABLE IF NOT EXISTS td_api_mock (
			id TEXT PRIMARY KEY NOT NULL,
			request_name TEXT NOT NULL,
			group_id TEXT,
			method TEXT,
			end_point TEXT NOT NULL,
			headers_text TEXT,
			body_text TEXT,
			response_text TEXT,
			response_headers_text TEXT,
			status_code INTEGER DEFAULT 0,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_api_mock_group
		`CREATE TABLE IF NOT EXISTS td_api_mock_group (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_api_testing
		`CREATE TABLE IF NOT EXISTS td_api_testing (
			id TEXT PRIMARY KEY NOT NULL,
			request_name TEXT NOT NULL,
			group_id TEXT,
			method TEXT,
			end_point TEXT NOT NULL,
			headers_text TEXT,
			body_text TEXT,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_api_testing_log
		`CREATE TABLE IF NOT EXISTS td_api_testing_log (
			id TEXT PRIMARY KEY NOT NULL,
			api_url TEXT NOT NULL,
			method TEXT,
			headers_text TEXT,
			body_text TEXT,
			response_text TEXT,
			response_headers_text TEXT,
			status_code INTEGER,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_api_testing_group
		`CREATE TABLE IF NOT EXISTS td_api_testing_group (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_api_testing_pro_mode
		`CREATE TABLE IF NOT EXISTS td_api_testing_pro_mode (
			id TEXT PRIMARY KEY NOT NULL,
			request_name TEXT NOT NULL,
			group_id TEXT,
			script_code TEXT,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_api_testing_pro_mode_group
		`CREATE TABLE IF NOT EXISTS td_api_testing_pro_mode_group (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_rdp_connection
		`CREATE TABLE IF NOT EXISTS td_rdp_connection (
			id TEXT PRIMARY KEY NOT NULL,
			connection_name TEXT NOT NULL,
			host TEXT NOT NULL,
			username TEXT,
			password TEXT,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_postgresql_connection
		`CREATE TABLE IF NOT EXISTS td_postgresql_connection (
			id TEXT PRIMARY KEY NOT NULL,
			connection_name TEXT NOT NULL,
			group_id TEXT,
			connection_string TEXT NOT NULL,
			connect_type INTEGER NOT NULL DEFAULT 0,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_postgresql_connection_group
		`CREATE TABLE IF NOT EXISTS td_postgresql_connection_group (
			id TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		// td_postgresql_saved_query
		`CREATE TABLE IF NOT EXISTS td_postgresql_saved_query (
			id TEXT PRIMARY KEY NOT NULL,
			query_name TEXT NOT NULL,
			connection_id TEXT,
			query_text TEXT,
			created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
	}

	// Danh sách các script migration (ALTER TABLE) cho các bảng đã tồn tại
	migrationScripts := []string{
		"ALTER TABLE td_api_mock ADD COLUMN headers_text TEXT",
		"ALTER TABLE td_api_mock ADD COLUMN response_headers_text TEXT",
		"ALTER TABLE td_api_mock ADD COLUMN status_code INTEGER DEFAULT 0",
		"ALTER TABLE td_api_testing_log ADD COLUMN response_headers_text TEXT",
	}

	// Chạy tất cả script tạo bảng
	for _, script := range createScripts {
		_, err = db.Exec(script)
		if err != nil {
			td_common.LogError(fmt.Sprintf("%q: %s\n", err, script))
			return
		}
	}

	// Chạy tất cả script migration (bỏ qua lỗi nếu cột đã tồn tại)
	for _, script := range migrationScripts {
		db.Exec(script)
	}
}
