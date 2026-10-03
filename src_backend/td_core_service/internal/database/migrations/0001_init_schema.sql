-- 0001_init_schema.sql
--
-- Tạo toàn bộ schema của app.
-- Chạy lại bao nhiêu lần cũng an toàn (CREATE TABLE IF NOT EXISTS).
--
-- Quy ước đặt tên: td_<nghiệp vụ>_<master|detail>
--   - master (group): td_api_mock_group, td_api_testing_group, td_api_testing_pro_mode_group,
--                      td_postgresql_connection_group, td_rdp_connection_group
--   - detail (item) : bảng nghiệp vụ, có thêm cột group_id trỏ về master

-- ── API Testing ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS td_api_testing_group (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS td_api_testing (
	id TEXT PRIMARY KEY NOT NULL,
	request_name TEXT NOT NULL,
	group_id TEXT,
	method TEXT,
	end_point TEXT NOT NULL,
	headers_text TEXT,
	body_text TEXT,
	body_type TEXT DEFAULT 'json',
	form_data_text TEXT,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── API Testing Pro Mode ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS td_api_testing_pro_mode_group (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS td_api_testing_pro_mode (
	id TEXT PRIMARY KEY NOT NULL,
	request_name TEXT NOT NULL,
	group_id TEXT,
	script_code TEXT,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── API Mocking ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS td_api_mock_group (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS td_api_mock (
	id TEXT PRIMARY KEY NOT NULL,
	request_name TEXT NOT NULL,
	group_id TEXT,
	method TEXT,
	end_point TEXT NOT NULL,
	headers_text TEXT,
	body_text TEXT,
	body_type TEXT DEFAULT 'json',
	form_data_text TEXT,
	response_text TEXT,
	response_headers_text TEXT,
	status_code INTEGER DEFAULT 0,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── PostgreSQL connection ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS td_postgresql_connection_group (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS td_postgresql_connection (
	id TEXT PRIMARY KEY NOT NULL,
	connection_name TEXT NOT NULL,
	group_id TEXT,
	connection_string TEXT NOT NULL,
	connect_type INTEGER NOT NULL DEFAULT 0,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── RDP connection ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS td_rdp_connection_group (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS td_rdp_connection (
	id TEXT PRIMARY KEY NOT NULL,
	connection_name TEXT NOT NULL,
	group_id TEXT,
	host TEXT NOT NULL,
	username TEXT,
	password TEXT,
	created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
	modified_date DATETIME DEFAULT CURRENT_TIMESTAMP
);