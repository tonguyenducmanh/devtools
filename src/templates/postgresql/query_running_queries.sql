-- query danh sách lệnh đang chạy của 1 db cụ thể
select 
  query, 
    state 
from 
  pg_catalog.pg_stat_activity 
where 
  datname = 'your_db_name' and pid <> pg_backend_pid() limit 50;
  
-- query danh sách lệnh đang chạy khác idle
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