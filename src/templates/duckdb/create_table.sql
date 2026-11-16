-- ========================================================
-- CHỦ ĐỀ: Tạo bảng (Create Table)
-- Lưu ý: 'path/to/...' là đường dẫn file trên máy của bạn (nơi daemon chạy).
-- Ví dụ:
--   - Windows:     'C:/data/data.csv' hoặc 'D:/reports/data.json'
--   - macOS/Linux: '/Users/username/data.csv' hoặc '/home/user/data.json'
-- ========================================================

-- 1. Tạo bảng trực tiếp từ file CSV
CREATE TABLE my_table_csv AS 
SELECT * 
FROM 'path/to/data.csv';


-- 2. Tạo bảng trực tiếp từ file JSON
CREATE TABLE my_table_json AS 
SELECT * 
FROM 'path/to/data.json';


-- 3. Tạo bảng với định nghĩa cột chuẩn
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR,
    email VARCHAR,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
