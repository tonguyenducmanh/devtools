WITH input AS (
  SELECT 'your_table_name'::text AS tracked_table
)
-- Tạo bảng log
SELECT 'CREATE TABLE IF NOT EXISTS delete_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_by_user VARCHAR(100),
    current_query TEXT
);' AS create_log_table
LIMIT 1;

WITH input AS (
  SELECT 'your_table_name'::text AS tracked_table
)
-- Tạo function trigger
SELECT 'CREATE OR REPLACE FUNCTION log_deleted_row()
RETURNS TRIGGER AS $func$
BEGIN
    INSERT INTO delete_logs (table_name, deleted_by_user, current_query)
    VALUES (TG_TABLE_NAME, current_user, current_query());
    RETURN OLD;
END;
$func$ LANGUAGE plpgsql;' AS create_trigger_function
LIMIT 1;

WITH input AS (
  SELECT 'your_table_name'::text AS tracked_table
)
-- Gán trigger vào bảng cần track
SELECT 'CREATE TRIGGER trg_track_delete
BEFORE DELETE ON ' || quote_ident(i.tracked_table) || '
FOR EACH ROW
EXECUTE FUNCTION log_deleted_row();' AS apply_trigger
FROM input i
LIMIT 1;

WITH input AS (
  SELECT 'your_table_name'::text AS tracked_table
)
-- Xem lịch sử xóa
SELECT * FROM delete_logs
ORDER BY deleted_at DESC
LIMIT 100;
