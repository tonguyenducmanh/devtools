WITH input AS (
  SELECT 'your_db_name'::text AS db_name
)
SELECT
  pid,
  usename AS username,
  application_name,
  client_addr,
  state,
  wait_event_type,
  wait_event,
  now() - query_start AS duration,
  query_start,
  left(query, 500) AS query_preview
FROM input i
JOIN pg_stat_activity a ON a.datname = i.db_name
WHERE a.state != 'idle'
  AND a.pid != pg_backend_pid()
ORDER BY duration DESC NULLS LAST
LIMIT 50;
