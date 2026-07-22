-- Dùng để xem PostgreSQL thực thi query như thế nào:
-- LƯU Ý: Được wrap trong BEGIN/ROLLBACK để an toàn,
-- query DML (INSERT/UPDATE/DELETE) sẽ KHÔNG thay đổi dữ liệu thật.
BEGIN;
EXPLAIN (ANALYZE, BUFFERS, COSTS, VERBOSE, FORMAT JSON)
-- nội dung câu query của bạn
ROLLBACK;
