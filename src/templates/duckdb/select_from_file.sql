-- ========================================================
-- CHỦ ĐỀ: Truy vấn dữ liệu từ file (CSV, JSON, Excel, ODS)
-- Lưu ý: 'path/to/...' là đường dẫn file trên máy của bạn (nơi daemon chạy).
-- Ví dụ:
--   - Windows:     'C:/data/data.csv' hoặc 'D:/reports/data.json'
--   - macOS/Linux: '/Users/username/data.csv' hoặc '/home/user/data.json'
-- ========================================================

-- 1. Đọc file CSV
-- Cách 1: Đọc nhanh 1 file (tự động nhận diện cấu trúc)
SELECT * 
FROM 'path/to/data.csv' 
LIMIT 100;

-- Cách 2: Dùng read_csv để đọc nhiều file cùng lúc bằng ký tự đại diện (*)
-- DuckDB sẽ tự động gộp (union) tất cả file khớp mẫu thành 1 bảng:
SELECT * 
FROM read_csv('path/to/sales_*.csv', auto_detect = true) 
LIMIT 100;


-- 2. Đọc file JSON / JSON Lines (.ndjson, .jsonl)
-- Cách 1: Đọc nhanh 1 file JSON
SELECT * 
FROM 'path/to/logs.json' 
LIMIT 100;

-- Cách 2: Dùng read_json_auto để tự động dò kiểu, bóc tách object/array lồng nhau,
-- hoặc đọc cùng lúc nhiều file JSON:
SELECT * 
FROM read_json_auto('path/to/logs_*.json') 
LIMIT 100;


-- 3. Truy vấn sheet từ file Excel (.xlsx) hoặc LibreOffice (.ods) đã nạp
-- (Sau khi nạp file, DuckDB Query tự động tạo bảng theo định dạng: <tên_file>_<tên_sheet>)
SELECT * 
FROM sales_sheet1 
LIMIT 100;

-- Có thể JOIN giữa các sheet hoặc các file:
-- SELECT a.*, b.customer_name 
-- FROM sales_sheet1 a 
-- JOIN customers_sheet1 b ON a.customer_id = b.id;


-- 4. Cú pháp viết FROM đứng trước SELECT (Friendlier SQL độc đáo của DuckDB)
-- DuckDB cho phép đặt FROM ở đầu câu lệnh để viết query tự nhiên hơn:
FROM users 
WHERE age > 25 
SELECT name, email;

-- Hoặc lấy toàn bộ bảng cực nhanh không cần gõ SELECT *:
-- FROM users;
