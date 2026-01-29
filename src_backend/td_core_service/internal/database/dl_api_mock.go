package database

import (
	"td_core_service/internal/model"
)

/**
 * Lấy tất cả mock API từ database
 */
func GetAllMockAPIs() ([]model.TDAPIMockParam, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, request_name, group_name, method, end_point, body_text, response_text FROM td_api_mock ORDER BY group_name, request_name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mocks []model.TDAPIMockParam
	for rows.Next() {
		var mock model.TDAPIMockParam
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
func GetAllMockAPIsForAutoStart() ([]model.TDAPIMockParam, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT id, request_name, group_name, method, end_point, body_text, response_text FROM td_api_mock")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mocks []model.TDAPIMockParam
	for rows.Next() {
		var mock model.TDAPIMockParam
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
func CreateMockAPI(mock *model.TDAPIMockParam) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(`
		INSERT INTO td_api_mock (id, request_name, group_name, method, end_point, body_text, response_text)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, mock.ID, mock.RequestName, mock.GroupName, mock.Method, mock.Endpoint, mock.BodyText, mock.ResponeText)

	return err
}

/**
 * Cập nhật mock API trong database
 */
func UpdateMockAPI(mock *model.TDAPIMockParam) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	result, err := db.Exec(`
		UPDATE td_api_mock 
		SET request_name = ?, group_name = ?, method = ?, end_point = ?, body_text = ?, response_text = ?, modififed_date = CURRENT_TIMESTAMP
		WHERE id = ?
	`, mock.RequestName, mock.GroupName, mock.Method, mock.Endpoint, mock.BodyText, mock.ResponeText, mock.ID)

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

	result, err := db.Exec("DELETE FROM td_api_mock WHERE id = ?", id)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}
