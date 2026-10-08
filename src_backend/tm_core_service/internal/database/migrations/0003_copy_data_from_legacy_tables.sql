-- 0003_copy_data_from_legacy_tables.sql
--
-- Chuyển dữ liệu từ bảng td_* (bản cũ) sang bảng tm_* (bản hiện hành).
--
-- VÌ SAO CHẠY SAU 0001:
-- 0001 đã tạo bảng tm_* với schema đầy đủ (PRIMARY KEY, NOT NULL, DEFAULT...).
-- Nếu chạy trước 0001 thì bảng tm_* chưa tồn tại và không có chỗ để chứa dữ liệu.
--
-- VÌ SAO INSERT chứ không phải CREATE TABLE ... AS SELECT:
-- CREATE TABLE ... AS SELECT chỉ copy tên cột và kiểu do SQLite suy ra, làm mất
-- PRIMARY KEY / NOT NULL / DEFAULT. Ở đây bảng tm_* đã có sẵn schema đúng từ 0001,
-- nên chỉ copy DỮ LIỆU là đủ, không đụng tới constraint nào.
--
-- Thứ tự cột của td_* và tm_* là giống nhau (cùng bộ migration 0001/0002), nên
-- SELECT * an toàn.
--
-- "no such table" là chuyện bình thường: database mới không có bảng td_* nào để
-- chuyển, hoặc lần khởi động trước đã chuyển xong. Runner bỏ qua lỗi này.
--
-- INSERT OR IGNORE: nếu bảng tm_* đã có dòng cùng id (app từng ghi vào, hoặc chạy
-- lại nhiều lần) thì bỏ qua dòng trùng thay vì báo lỗi — không tạo bản sao dữ liệu.
--
-- Thứ tự an toàn: nếu một câu INSERT lỗi thật, runner dừng ngay và KHÔNG chạy tới
-- DROP, nên không bao giờ xoá mất dữ liệu.

-- ── API Testing ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO tm_api_testing_group SELECT * FROM td_api_testing_group;
INSERT OR IGNORE INTO tm_api_testing SELECT * FROM td_api_testing;

-- ── API Testing Pro Mode ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO tm_api_testing_pro_mode_group SELECT * FROM td_api_testing_pro_mode_group;
INSERT OR IGNORE INTO tm_api_testing_pro_mode SELECT * FROM td_api_testing_pro_mode;

-- ── API Mocking ──────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO tm_api_mock_group SELECT * FROM td_api_mock_group;
INSERT OR IGNORE INTO tm_api_mock SELECT * FROM td_api_mock;

-- ── PostgreSQL connection ────────────────────────────────────────────────────
INSERT OR IGNORE INTO tm_postgresql_connection_group SELECT * FROM td_postgresql_connection_group;
INSERT OR IGNORE INTO tm_postgresql_connection SELECT * FROM td_postgresql_connection;

-- ── RDP connection ───────────────────────────────────────────────────────────
INSERT OR IGNORE INTO tm_rdp_connection_group SELECT * FROM td_rdp_connection_group;
INSERT OR IGNORE INTO tm_rdp_connection SELECT * FROM td_rdp_connection;

-- ── Xoá bảng cũ ──────────────────────────────────────────────────────────────
-- Chỉ chạy được sau khi dữ liệu đã chuyển xong ở phần trên.
-- DROP TABLE IF EXISTS nên chạy lại bao nhiêu lần cũng an toàn.

DROP TABLE IF EXISTS td_api_testing_group;
DROP TABLE IF EXISTS td_api_testing;
DROP TABLE IF EXISTS td_api_testing_pro_mode_group;
DROP TABLE IF EXISTS td_api_testing_pro_mode;
DROP TABLE IF EXISTS td_api_mock_group;
DROP TABLE IF EXISTS td_api_mock;
DROP TABLE IF EXISTS td_postgresql_connection_group;
DROP TABLE IF EXISTS td_postgresql_connection;
DROP TABLE IF EXISTS td_rdp_connection_group;
DROP TABLE IF EXISTS td_rdp_connection;
