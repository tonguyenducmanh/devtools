-- ========================================================
-- CHỦ ĐỀ: Xuất kết quả câu SELECT ra file theo đường dẫn
-- Lưu ý: '/path/to/...' là đường dẫn file trên máy của bạn (nơi daemon chạy).
-- Ví dụ:
--   - Windows:     'C:/data/output.csv' hoặc 'D:/exports/data.json'
--   - macOS/Linux: '/Users/username/output.csv' hoặc '/home/user/data.json'
-- ========================================================

-- 1. Xuất ra file CSV
COPY (
    SELECT * 
    FROM my_table
) TO '/path/to/output.csv' (HEADER, DELIMITER ',');

-- 2. Xuất ra file JSON (Mảng các object [{...}, {...}])
COPY (
    SELECT * 
    FROM my_table
) TO '/path/to/output.json' (ARRAY TRUE);

-- 3. Xuất ra file Parquet
COPY (
    SELECT * 
    FROM my_table
) TO '/path/to/output.parquet';
