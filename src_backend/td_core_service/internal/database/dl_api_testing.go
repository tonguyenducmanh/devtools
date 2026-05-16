package database

import (
	"td_core_service/internal/model"
)

// Xóa nhóm API testing và các test thuộc nhóm đó
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
			group_id = ?
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

// Import hàng loạt dữ liệu API testing (Groups + Items) trong 1 transaction
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
		sqlItem := `INSERT INTO td_api_testing (id, request_name, group_id, method, end_point, headers_text, body_text) VALUES (?, ?, ?, ?, ?, ?, ?)`
		stmtItem, err := tx.Prepare(sqlItem)
		if err != nil {
			tx.Rollback()
			return err
		}
		defer stmtItem.Close()

		for _, item := range batch.Items {
			_, err = stmtItem.Exec(item.ID, item.RequestName, item.GroupID, item.Method, item.Endpoint, item.HeadersText, item.BodyText)
			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}

// log dữ liệu vào db
func LogDataCallAPIToDatabase(reqData model.TDAPITestingParam, responseText string, statusCode int, id string) {
	db, err := GetConnectionDB()
	if err != nil {
		// không làm gì
	}
	defer db.Close()

	sqlQuery := `
		INSERT INTO td_api_testing_log (
			id,
			api_url,
			method,
			headers_text,
			body_text,
			response_text,
			status_code
		) 
		VALUES (
			?, ?, ?, ?, ?, ?, ?
		)
	`
	_, err = db.Exec(sqlQuery, id, reqData.ApiURL, reqData.HttpMethod, reqData.HeadersText, reqData.BodyText, responseText, statusCode)

	// không làm gì
}
