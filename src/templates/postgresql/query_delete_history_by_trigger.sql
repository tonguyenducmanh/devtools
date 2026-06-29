-- tạo bảng quản lý các câu query xóa và trigger mỗi khi có sự kiện xóa trong bảng cụ thể
-- ten_bang_cua_ban là bảng cần monitor, chỉ khuyến khích để debug không rõ do cái gì xóa bảng

CREATE TABLE delete_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_by_user VARCHAR(100),
    current_query TEXT
);

CREATE OR REPLACE FUNCTION log_deleted_row()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO delete_logs (table_name, deleted_by_user, current_query)
    VALUES (TG_TABLE_NAME, current_user, current_query());
    RETURN OLD; -- Trả về OLD để cho phép hành động xóa tiếp tục diễn ra bình thường
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_track_delete
BEFORE DELETE ON ten_bang_cua_ban
FOR EACH ROW
EXECUTE FUNCTION log_deleted_row();

-- dọn dẹp sau khi dùng xong
-- DROP TRIGGER IF EXISTS trg_track_delete ON ten_bang_cua_ban;
-- DROP FUNCTION IF EXISTS log_deleted_row();
-- DROP TABLE IF EXISTS delete_logs;