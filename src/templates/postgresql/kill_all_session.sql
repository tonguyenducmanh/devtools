WITH input AS (
  SELECT 'your_database_name'::text AS db_name
),
targets AS (
  SELECT pid, usename, application_name, state, now() - query_start AS duration, left(query, 200) AS query_preview
  FROM input i
  JOIN pg_stat_activity a ON a.datname = i.db_name
  WHERE a.pid != pg_backend_pid()
    AND a.state != 'idle'
)
-- Bước 1: Xem danh sách session sẽ bị kill
SELECT pid, usename, application_name, state, duration, query_preview, 'will be terminated' AS action
FROM targets
ORDER BY duration DESC NULLS LAST
LIMIT 100;
