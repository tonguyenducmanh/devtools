package database

import (
	"td_core_service/internal/model"
)

/**
 * Lấy tất cả API testing từ database
 */
func GetAllTestingAPIs() ([]model.TDAPITestingItem, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	sqlQuery := `
		SELECT 
			id, 
			request_name, 
			group_name, 
			method, 
			end_point, 
			headers_text, 
			body_text 
		FROM 
			td_api_testing 
		ORDER BY 
			created_date DESC
	`
	rows, err := db.Query(sqlQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tests []model.TDAPITestingItem
	for rows.Next() {
		var test model.TDAPITestingItem
		err := rows.Scan(&test.ID, &test.RequestName, &test.GroupName, &test.Method, &test.Endpoint, &test.HeadersText, &test.BodyText)
		if err != nil {
			continue
		}
		tests = append(tests, test)
	}

	return tests, nil
}

/**
 * Tạo API testing mới
 */
func CreateTestingAPI(test *model.TDAPITestingItem) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	sqlQuery := `
		INSERT INTO td_api_testing (
			id, 
			request_name, 
			group_name, 
			method, 
			end_point, 
			headers_text, 
			body_text
		)
		VALUES (
			?, ?, ?, ?, ?, ?, ?
		)
	`
	_, err = db.Exec(sqlQuery, test.ID, test.RequestName, test.GroupName, test.Method, test.Endpoint, test.HeadersText, test.BodyText)

	return err
}

/**
 * Cập nhật API testing
 */
func UpdateTestingAPI(test *model.TDAPITestingItem) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sqlQuery := `
		UPDATE 
			td_api_testing 
		SET 
			request_name = ?, 
			group_name = ?, 
			method = ?, 
			end_point = ?, 
			headers_text = ?, 
			body_text = ?, 
			modififed_date = CURRENT_TIMESTAMP
		WHERE 
			id = ?
	`

	result, err := db.Exec(sqlQuery, test.RequestName, test.GroupName, test.Method, test.Endpoint, test.HeadersText, test.BodyText, test.ID)

	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

/**
 * Xóa API testing
 */
func DeleteTestingAPI(id string) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sqlQuery := `
		DELETE FROM 
			td_api_testing 
		WHERE 
			id = ?
	`
	result, err := db.Exec(sqlQuery, id)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

/**
 * Lấy tất cả nhóm API testing
 */
func GetAllTestingGroups() ([]model.TDAPITestingGroup, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	sqlQuery := `
		SELECT 
			id, 
			name 
		FROM 
			td_api_testing_group 
		ORDER BY 
			created_date DESC
	`
	rows, err := db.Query(sqlQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []model.TDAPITestingGroup
	for rows.Next() {
		var group model.TDAPITestingGroup
		err := rows.Scan(&group.ID, &group.Name)
		if err != nil {
			continue
		}
		groups = append(groups, group)
	}

	return groups, nil
}

/**
 * Tạo nhóm API testing mới
 */
func CreateTestingGroup(group *model.TDAPITestingGroup) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	sqlQuery := `
		INSERT INTO td_api_testing_group (
			id, 
			name
		) 
		VALUES (
			?, ?
		)
	`
	_, err = db.Exec(sqlQuery, group.ID, group.Name)

	return err
}

/**
 * Cập nhật nhóm API testing
 */
func UpdateTestingGroup(group *model.TDAPITestingGroup) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sqlQuery := `
		UPDATE 
			td_api_testing_group 
		SET 
			name = ?
		WHERE 
			id = ?
	`
	result, err := db.Exec(sqlQuery, group.Name, group.ID)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

/**
 * Xóa nhóm API testing và các test thuộc nhóm đó
 */
func DeleteTestingGroup(id string) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	// 1. Xóa các testing api thuộc nhóm
	sqlDeleteItems := `
		DELETE FROM 
			td_api_testing 
		WHERE 
			group_name = (
				SELECT 
					name 
				FROM 
					td_api_testing_group 
				WHERE 
					id = ?
			)
	`
	_, err = tx.Exec(sqlDeleteItems, id)
	if err != nil {
		tx.Rollback()
		return err
	}

	// 2. Xóa nhóm
	sqlDeleteGroup := `
		DELETE FROM 
			td_api_testing_group 
		WHERE 
			id = ?
	`
	_, err = tx.Exec(sqlDeleteGroup, id)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

/**
 * Import hàng loạt dữ liệu API testing (Groups + Items) trong 1 transaction
 */
func BatchImportTestingData(batch *model.TDAPITestingImportBatch) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	// 1. Insert Groups
	if len(batch.Groups) > 0 {
		sqlGroup := `INSERT OR IGNORE INTO td_api_testing_group (id, name) VALUES (?, ?)`
		stmtGroup, err := tx.Prepare(sqlGroup)
		if err != nil {
			tx.Rollback()
			return err
		}
		defer stmtGroup.Close()

		for _, group := range batch.Groups {
			_, err = stmtGroup.Exec(group.ID, group.Name)
			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	// 2. Insert Items
	if len(batch.Items) > 0 {
		sqlItem := `INSERT INTO td_api_testing (id, request_name, group_name, method, end_point, headers_text, body_text) VALUES (?, ?, ?, ?, ?, ?, ?)`
		stmtItem, err := tx.Prepare(sqlItem)
		if err != nil {
			tx.Rollback()
			return err
		}
		defer stmtItem.Close()

		for _, item := range batch.Items {
			_, err = stmtItem.Exec(item.ID, item.RequestName, item.GroupName, item.Method, item.Endpoint, item.HeadersText, item.BodyText)
			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}
