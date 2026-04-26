-- query danh sách lệnh đang chạy
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
    left(query, 200) AS query_preview
FROM pg_stat_activity
WHERE state != 'idle'
  AND pid != pg_backend_pid()
ORDER BY duration DESC NULLS LAST
LIMIT 50;