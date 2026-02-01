package database

import "fmt"

/**
 * thực hiện lấy danh sách toàn bộ bảng trong database
 */
func GetAllTableInDatabase() ([]string, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	sqlQuery := `
		SELECT 
			name 
		FROM 
			sqlite_master 
		WHERE 
			type='table' 
			AND name NOT LIKE 'sqlite_%';
	`
	rows, err := db.Query(sqlQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var allTableNames []string
	for rows.Next() {
		var currentTableName string
		err := rows.Scan(&currentTableName)
		if err != nil {
			continue
		}
		allTableNames = append(allTableNames, currentTableName)
	}

	return allTableNames, nil
}

/**
 * thực hiện lấy danh sách toàn bộ dữ liệu trong 1 bảng trong database
 */
func GetAllDataByTableName(tableName string) ([]map[string]any, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	// Sử dụng Sprintf vì tên bảng không thể dùng placeholder (?)
	query := fmt.Sprintf("SELECT * FROM %s WHERE 1 = 1;", tableName)
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Lấy danh sách tên các cột để map dữ liệu chính xác
	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var results []map[string]any

	for rows.Next() {
		// Tạo một slice chứa các interface để nhận dữ liệu từ Scan
		values := make([]any, len(columns))
		valuePtrs := make([]any, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		// Scan dữ liệu vào các con trỏ
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		// Chuyển dữ liệu từ slice vào map
		rowMap := make(map[string]any)
		for i, colName := range columns {
			val := values[i]

			// SQLite đôi khi trả về []byte cho chuỗi, có thể ép kiểu tại đây nếu cần
			if b, ok := val.([]byte); ok {
				rowMap[colName] = string(b)
			} else {
				rowMap[colName] = val
			}
		}
		results = append(results, rowMap)
	}

	return results, nil
}
