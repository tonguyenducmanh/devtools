package database

import (
	"database/sql"
	"fmt"
	"sync"

	_ "modernc.org/sqlite"
)

var (
	globalDB   *sql.DB
	globalOnce sync.Once
	globalErr  error
)

// GetConnectionDB trả về singleton *sql.DB đã được configure đúng.
// Tất cả goroutine dùng chung 1 pool — KHÔNG gọi Close() trên object này.
func GetConnectionDB() (*sql.DB, error) {
	globalOnce.Do(func() {
		dsn := dbPath() // hàm hiện tại trả về đường dẫn file sqlite

		db, err := sql.Open("sqlite", dsn)
		if err != nil {
			globalErr = fmt.Errorf("mở SQLite thất bại: %w", err)
			return
		}

		// QUAN TRỌNG: giới hạn 1 writer connection để tránh SQLITE_BUSY
		// SQLite không hỗ trợ concurrent writers dù có WAL
		db.SetMaxOpenConns(1)
		db.SetMaxIdleConns(1)

		// Set PRAGMA trên connection pool thực sự được dùng
		pragmas := []string{
			"PRAGMA journal_mode=WAL",
			"PRAGMA busy_timeout=5000",
			"PRAGMA synchronous=NORMAL", // an toàn với WAL, nhanh hơn FULL
			"PRAGMA cache_size=-64000",  // 64MB page cache
			"PRAGMA foreign_keys=ON",
		}
		for _, p := range pragmas {
			if _, err := db.Exec(p); err != nil {
				globalErr = fmt.Errorf("set pragma thất bại [%s]: %w", p, err)
				db.Close()
				return
			}
		}

		globalDB = db
	})

	if globalErr != nil {
		return nil, globalErr
	}
	return globalDB, nil
}
