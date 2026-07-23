package database

import (
	"database/sql"
)

// GetAllTableAndColumns trả về danh sách tất cả bảng kèm columns (dùng cho intellisense)
func GetAllTableAndColumns() ([]map[string]any, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}

	query := `
	SELECT
		m.name as table_name,
		p.name as column_name,
		p.type as data_type,
		p.pk
	FROM
		sqlite_master m
		JOIN pragma_table_info (m.name) p
	WHERE
		m.type = 'table'
		AND m.name NOT LIKE 'sqlite_%'
	ORDER BY
		m.name,
		p.cid;
	`
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tableMap := make(map[string][]map[string]any)
	var tableOrder []string
	for rows.Next() {
		var tableName, columnName, dataType string
		var pk int
		if err := rows.Scan(&tableName, &columnName, &dataType, &pk); err != nil {
			continue
		}
		if _, ok := tableMap[tableName]; !ok {
			tableOrder = append(tableOrder, tableName)
			tableMap[tableName] = []map[string]any{}
		}
		tableMap[tableName] = append(tableMap[tableName], map[string]any{
			"name": columnName,
			"type": dataType,
			"pk":   pk,
		})
	}

	var result []map[string]any
	for _, table := range tableOrder {
		result = append(result, map[string]any{
			"table_name": table,
			"columns":    tableMap[table],
		})
	}
	return result, nil
}

// DataMinerExecuteQuery thực hiện query động theo yêu cầu của user
func DataMinerExecuteQuery(script string) ([]map[string]any, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}

	rows, err := db.Query(script)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return appMinerReadDynamicData(rows)
}

// hàm đọc dữ liệu động trả về cho frontend
func appMinerReadDynamicData(rows *sql.Rows) ([]map[string]any, error) {
	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var results []map[string]any

	for rows.Next() {
		values := make([]any, len(columns))
		valuePtrs := make([]any, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}

		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}

		rowMap := make(map[string]any)
		for i, colName := range columns {
			val := values[i]
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
