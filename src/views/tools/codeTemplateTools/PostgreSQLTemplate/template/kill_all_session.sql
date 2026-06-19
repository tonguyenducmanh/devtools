-- kill toàn bộ session trong 1 database
-- kết nối tới 1 database khác có cùng server với database định kill
SELECT 
    pg_terminate_backend(pg_stat_activity.pid)
FROM 
    pg_stat_activity
WHERE 
    pg_stat_activity.datname = 'ten_database_cua_ban'
    AND pid <> pg_backend_pid()
LIMIT 1;