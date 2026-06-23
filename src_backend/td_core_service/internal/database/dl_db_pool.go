package database

import (
	"database/sql"
	"fmt"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

var (
	globalDB *sql.DB
	globalMu sync.RWMutex
)

// GetConnectionDB trả về singleton *sql.DB đã được configure đúng.
// Tất cả goroutine dùng chung 1 pool — KHÔNG gọi Close() trên object này.
// Hỗ trợ tự phục hồi nếu connection bị đóng bất ngờ.
func GetConnectionDB() (*sql.DB, error) {
	// ── Fast path: đọc không lock write ──────────────────────────────────
	globalMu.RLock()
	db := globalDB
	globalMu.RUnlock()

	if db != nil {
		if err := db.Ping(); err == nil {
			return db, nil
		}
		// DB chết → fall through để reinit
	}

	// ── Slow path: khởi tạo hoặc reinit ──────────────────────────────────
	globalMu.Lock()
	defer globalMu.Unlock()

	// Double-check sau khi lấy write lock (goroutine khác có thể đã reinit)
	if globalDB != nil {
		if err := globalDB.Ping(); err == nil {
			return globalDB, nil
		}
		// DB cũ thực sự chết, đóng lại trước khi tạo mới
		_ = globalDB.Close()
		globalDB = nil
	}

	newDB, err := openAndConfigure()
	if err != nil {
		return nil, err
	}

	globalDB = newDB
	return globalDB, nil
}

// openAndConfigure mở SQLite và set toàn bộ PRAGMA cần thiết.
func openAndConfigure() (*sql.DB, error) {
	dsn := dbPath()

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("mở SQLite thất bại: %w", err)
	}

	// Ping thực sự để phát hiện lỗi sớm (sql.Open() không connect ngay)
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping SQLite thất bại: %w", err)
	}

	// ── Connection pool ───────────────────────────────────────────────────
	// WAL mode: N readers chạy song song với 1 writer
	db.SetMaxOpenConns(4)
	db.SetMaxIdleConns(4)
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetConnMaxIdleTime(5 * time.Minute)

	// ── PRAGMA ────────────────────────────────────────────────────────────
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA wal_autocheckpoint=100",
		"PRAGMA busy_timeout=10000",
		"PRAGMA synchronous=NORMAL",
		"PRAGMA cache_size=-32000",
		"PRAGMA foreign_keys=ON",
		"PRAGMA temp_store=MEMORY",
		"PRAGMA mmap_size=268435456",
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			_ = db.Close()
			return nil, fmt.Errorf("set pragma thất bại [%s]: %w", p, err)
		}
	}

	return db, nil
}
