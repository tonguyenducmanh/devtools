WITH input AS (
  SELECT
    'your_db_name'::text AS db_name,
    'idle in transaction'::text AS state_filter, -- 'active', 'idle in transaction', '%' for all
    'SELECT'::text AS query_keyword,             -- từ khóa trong câu query để lọc (ví dụ: 'SELECT', 'DELETE', '%' cho tất cả)
    300::int AS min_duration_seconds             -- chỉ kill các process chạy lâu hơn X giây (0 để kill tất cả)
),
targets AS (
  SELECT pid, usename, state, now() - query_start AS duration, left(query, 200) AS query_preview
  FROM input i
  JOIN pg_stat_activity a ON a.datname = i.db_name
  WHERE a.state ILIKE i.state_filter
    AND a.pid != pg_backend_pid()
    AND a.query ILIKE '%' || i.query_keyword || '%'
    AND (i.min_duration_seconds = 0 OR now() - a.query_start > (i.min_duration_seconds || ' seconds')::interval)
)
-- Bước 1: Xem danh sách các process sẽ bị kill
SELECT pid, usename, state, duration, query_preview, 'will be cancelled' AS action
FROM targets
UNION ALL
-- Bước 2: Thực hiện kill (comment nếu chỉ muốn xem trước)
-- SELECT pid, usename, state, duration, query_preview, pg_cancel_backend(pid)::text AS action
-- FROM targets
ORDER BY duration DESC
LIMIT 50;
