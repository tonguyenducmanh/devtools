-- 0004_duckdb_session.sql
--
-- Tạo bảng lưu trữ session DuckDB và danh sách file đã nạp.
-- Chạy lại bao nhiêu lần cũng an toàn (CREATE TABLE IF NOT EXISTS).

-- ── DuckDB Session ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tm_duckdb_session (
	id TEXT PRIMARY KEY NOT NULL,
	session_name TEXT NOT NULL,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── DuckDB Session File (các file đã nạp vào session) ───────────────────────

CREATE TABLE IF NOT EXISTS tm_duckdb_session_file (
	id TEXT PRIMARY KEY NOT NULL,
	session_id TEXT NOT NULL,
	file_name TEXT NOT NULL,
	table_name TEXT NOT NULL,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);
