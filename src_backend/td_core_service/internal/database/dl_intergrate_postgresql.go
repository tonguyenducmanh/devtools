package database

import (
	"context"
	"fmt"
	"td_core_service/internal/model"

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

// ExecutePostgreSQLQuery kết nối và thực thi SQL trên PostgreSQL, trả về kết quả dạng JSON-serializable
func ExecutePostgreSQLQuery(connectionString string, sqlQuery string) (*model.TDQueryResult, error) {
	ctx := context.Background()

	conn, err := pgx.Connect(ctx, connectionString)
	if err != nil {
		return nil, fmt.Errorf("không thể kết nối PostgreSQL: %w", err)
	}
	defer conn.Close(ctx)

	rows, err := conn.Query(ctx, sqlQuery)
	if err != nil {
		return nil, fmt.Errorf("lỗi thực thi query: %w", err)
	}
	defer rows.Close()

	fieldDescs := rows.FieldDescriptions()
	columns := make([]string, len(fieldDescs))
	for i, fd := range fieldDescs {
		columns[i] = string(fd.Name)
	}

	var resultRows []map[string]any
	for rows.Next() {
		vals, err := rows.Values()
		if err != nil {
			return nil, fmt.Errorf("lỗi đọc row: %w", err)
		}
		rowMap := make(map[string]any, len(columns))
		for i, col := range columns {
			v := vals[i]
			// Chuyển []byte thành string để JSON serializable
			if b, ok := v.([]byte); ok {
				rowMap[col] = string(b)
			} else {
				rowMap[col] = v
			}
		}
		resultRows = append(resultRows, rowMap)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("lỗi sau khi đọc rows: %w", rows.Err())
	}

	return &model.TDQueryResult{
		Columns:      columns,
		Rows:         resultRows,
		RowsAffected: int64(len(resultRows)),
		IsSelect:     true,
	}, nil
}

// ExecutePostgreSQLNonQuery thực thi câu lệnh không trả về rows (INSERT/UPDATE/DELETE/DDL)
func ExecutePostgreSQLNonQuery(connectionString string, sqlQuery string) (*model.TDQueryResult, error) {
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, connectionString)
	if err != nil {
		return nil, fmt.Errorf("không thể kết nối PostgreSQL: %w", err)
	}
	defer conn.Close(ctx)

	cmdTag, err := conn.Exec(ctx, sqlQuery)
	if err != nil {
		return nil, fmt.Errorf("lỗi thực thi: %w", err)
	}

	return &model.TDQueryResult{
		Columns:      []string{},
		Rows:         []map[string]any{},
		RowsAffected: cmdTag.RowsAffected(),
		IsSelect:     false,
	}, nil
}

// GetPostgreSQLKeywords lấy danh sách keywords từ PostgreSQL server
func GetPostgreSQLKeywords(connectionString string) ([]map[string]any, error) {
	return nil, nil // được gọi qua ExecutePostgreSQLQuery
}
