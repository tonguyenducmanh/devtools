-- 0002_add_missing_columns.sql
--
-- Bổ sung các cột còn thiếu cho database đã tạo từ phiên bản cũ.
--
-- Database mới không cần file này: 0001 đã tạo bảng với đầy đủ cột.
-- Database cũ thì thiếu, nên phải ALTER.
--
-- SQLite không có cú pháp "ADD COLUMN IF NOT EXISTS", nên câu lệnh chạy trên
-- database mới sẽ báo lỗi "duplicate column name". Runner coi lỗi này là
-- bình thường và bỏ qua — mọi lỗi khác vẫn được ghi log.
--
-- Thêm cột mới vào đây, KHÔNG sửa file cũ.

-- API mocking: response headers + status code + form data
ALTER TABLE td_api_mock ADD COLUMN headers_text TEXT;
ALTER TABLE td_api_mock ADD COLUMN response_headers_text TEXT;
ALTER TABLE td_api_mock ADD COLUMN status_code INTEGER DEFAULT 0;
ALTER TABLE td_api_mock ADD COLUMN body_type TEXT DEFAULT 'json';
ALTER TABLE td_api_mock ADD COLUMN form_data_text TEXT;

-- API testing: form data
ALTER TABLE td_api_testing ADD COLUMN body_type TEXT DEFAULT 'json';
ALTER TABLE td_api_testing ADD COLUMN form_data_text TEXT;

-- Chuẩn hoá master-detail: mọi bảng detail đều phải có group_id
ALTER TABLE td_api_mock ADD COLUMN group_id TEXT;
ALTER TABLE td_api_testing ADD COLUMN group_id TEXT;
ALTER TABLE td_api_testing_pro_mode ADD COLUMN group_id TEXT;
ALTER TABLE td_postgresql_connection ADD COLUMN group_id TEXT;
ALTER TABLE td_rdp_connection ADD COLUMN group_id TEXT;