package database

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
