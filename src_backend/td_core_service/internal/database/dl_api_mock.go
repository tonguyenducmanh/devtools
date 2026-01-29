package database

import (
	"td_core_service/internal/model"
)

/**
 * Lấy tất cả mock API từ database
 */
func GetAllMockAPIs() ([]model.TDAPIMockItem, error) {
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
			body_text, 
			response_text 
		FROM 
			td_api_mock 
		ORDER BY 
			created_date DESC
	`
	rows, err := db.Query(sqlQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mocks []model.TDAPIMockItem
	for rows.Next() {
		var mock model.TDAPIMockItem
		err := rows.Scan(&mock.ID, &mock.RequestName, &mock.GroupName, &mock.Method, &mock.Endpoint, &mock.BodyText, &mock.ResponeText)
		if err != nil {
			continue
		}
		mocks = append(mocks, mock)
	}

	return mocks, nil
}

/**
 * Lấy tất cả mock API để auto start (không sắp xếp)
 */
func GetAllMockAPIsForAutoStart() ([]model.TDAPIMockItem, error) {
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
			body_text, 
			response_text 
		FROM 
			td_api_mock
	`
	rows, err := db.Query(sqlQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mocks []model.TDAPIMockItem
	for rows.Next() {
		var mock model.TDAPIMockItem
		err := rows.Scan(&mock.ID, &mock.RequestName, &mock.GroupName, &mock.Method, &mock.Endpoint, &mock.BodyText, &mock.ResponeText)
		if err != nil {
			continue
		}
		mocks = append(mocks, mock)
	}

	return mocks, nil
}

/**
 * Tạo mock API mới trong database
 */
func CreateMockAPI(mock *model.TDAPIMockItem) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	sqlQuery := `
		INSERT INTO td_api_mock (
			id, 
			request_name, 
			group_name, 
			method, 
			end_point, 
			body_text, 
			response_text
		)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err = db.Exec(sqlQuery, mock.ID, mock.RequestName, mock.GroupName, mock.Method, mock.Endpoint, mock.BodyText, mock.ResponeText)

	return err
}

/**
 * Cập nhật mock API trong database
 */
func UpdateMockAPI(mock *model.TDAPIMockItem) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sqlQuery := `
		UPDATE 
			td_api_mock 
		SET 
			request_name = ?, 
			group_name = ?, 
			method = ?, 
			end_point = ?, 
			body_text = ?, 
			response_text = ?, 
			modififed_date = CURRENT_TIMESTAMP
		WHERE 
			id = ?
	`

	result, err := db.Exec(sqlQuery, mock.RequestName, mock.GroupName, mock.Method, mock.Endpoint, mock.BodyText, mock.ResponeText, mock.ID)

	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

/**
 * Xóa mock API khỏi database
 */
func DeleteMockAPI(id string) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sqlQuery := `DELETE FROM td_api_mock WHERE id = ?`
	result, err := db.Exec(sqlQuery, id)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}
