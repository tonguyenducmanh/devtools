package database

import (
	"context"
	"fmt"
	"td_core_service/internal/model"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// file này hướng tới việc gọi nối vào postgressl ở server khác
// coding sẽ là truyền từ UI vào
// chỉ có các config kết nối thì vẫn lưu ở sqlite của backend app

// Xóa toàn bộ connection thuộc 1 group (dùng khi xóa group)
func DeletePostgreSQLConnectionsByGroupID(groupID string) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()
	_, err = db.Exec("DELETE FROM td_postgresql_connection WHERE group_id = ?", groupID)
	return err
}

// Thực hiện query theo yêu cầu của User
func ExecutePostgreSQLQuery(connectionString string, sqlQuery string) (*model.TDQueryResult, error) {
	ctx := context.Background()

	// 1. Parse connection string ra object config
	config, err := pgx.ParseConfig(connectionString)
	if err != nil {
		return nil, fmt.Errorf("connection string không hợp lệ: %w", err)
	}

	// 2. ÉP BUỘC pgx sử dụng Simple Protocol để chạy được chuỗi nhiều câu lệnh
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	// 3. Kết nối bằng config mới
	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("không thể kết nối PostgreSQL: %w", err)
	}
	defer conn.Close(ctx)

	// Dùng conn.Query cho TẤT CẢ mọi thứ
	rows, err := conn.Query(ctx, sqlQuery)
	if err != nil {
		return nil, fmt.Errorf("lỗi thực thi query: %w", err)
	}
	defer rows.Close()

	// 1. Lấy thông tin cột trước
	fieldDescs := rows.FieldDescriptions()
	columns := make([]string, len(fieldDescs))
	for i, fd := range fieldDescs {
		columns[i] = string(fd.Name)
	}

	// 2. Đọc dữ liệu nếu có
	var resultRows []map[string]any
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return nil, fmt.Errorf("lỗi đọc row: %w", err)
		}
		rowMap := make(map[string]any, len(columns))
		for i, col := range columns {
			switch v := vals[i].(type) {
			case []byte:
				rowMap[col] = string(v)
			case [16]byte: // uuid đơn
				rowMap[col] = uuid.UUID(v).String()
			case [][16]byte: // mảng uuid[]
				ids := make([]string, len(v))
				for j, b := range v {
					ids[j] = uuid.UUID(b).String()
				}
				rowMap[col] = ids
			default:
				rowMap[col] = v
			}
		}
		resultRows = append(resultRows, rowMap)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("lỗi sau khi đọc rows: %w", rows.Err())
	}

	// Lấy chính xác RowsAffected từ CommandTag của câu lệnh
	cmdTag := rows.CommandTag()
	rowsAffected := cmdTag.RowsAffected()

	// Nếu là câu lệnh SELECT thì RowsAffected từ CommandTag thường bằng 0 hoặc tùy driver,
	// ta sẽ lấy số lượng row đọc được làm RowsAffected nếu đó là câu lệnh SELECT thực sự.
	isSelect := len(columns) > 0
	if isSelect {
		rowsAffected = int64(len(resultRows))
	}

	return &model.TDQueryResult{
		Columns:      columns,
		Rows:         resultRows,
		RowsAffected: rowsAffected, // Trả về số dòng chuẩn xác cho cả INSERT/UPDATE lẫn SELECT
		IsSelect:     isSelect,
	}, nil
}
