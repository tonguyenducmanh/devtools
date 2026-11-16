-- ========================================================
-- CHỦ ĐỀ: Các lệnh tiện ích khám phá dữ liệu (Utility Keywords)
-- ========================================================

-- 1. SUMMARIZE: Thống kê nhanh toàn bộ cột (min, max, null, distinct, avg,...)
-- Thống kê bảng có sẵn:
SUMMARIZE my_table;

-- Hoặc thống kê trực tiếp từ file hoặc câu query:
-- SUMMARIZE SELECT * FROM 'path/to/data.csv';


-- 2. DESCRIBE: Xem danh sách cột, kiểu dữ liệu và nullability
-- Xem cấu trúc bảng:
DESCRIBE my_table;

-- Hoặc xem cấu trúc của file:
-- DESCRIBE SELECT * FROM 'path/to/data.json';


-- 3. SHOW TABLES: Xem danh sách toàn bộ bảng và view trong session hiện tại
SHOW TABLES;


-- 4. EXPLAIN ANALYZE: Phân tích kế hoạch thực thi và thời gian chạy câu query
EXPLAIN ANALYZE 
SELECT * 
FROM my_table 
WHERE status = 'ACTIVE';
