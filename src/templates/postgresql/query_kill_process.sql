-- kill 1 lệnh SQL đang chạy theo pid cụ thể
-- Bước 1: dùng pg_cancel_backend để gửi tín hiệu cancel (nhẹ, ưu tiên dùng trước)
SELECT pg_cancel_backend(12345);

-- Bước 2: nếu cancel không hiệu quả, dùng pg_terminate_backend để kill hẳn process
-- SELECT pg_terminate_backend(12345);

 
-- Kill tất cả các lệnh đang chạy quá X giây (ví dụ 300 giây / 5 phút)
-- SELECT
--     pid,
--     usename,
--     now() - query_start AS duration,
--     query,
--     pg_terminate_backend(pid) AS killed
-- FROM pg_stat_activity
-- WHERE state != 'idle'
--   AND pid != pg_backend_pid()
--   AND now() - query_start > interval '300 seconds'
-- ORDER BY duration DESC;