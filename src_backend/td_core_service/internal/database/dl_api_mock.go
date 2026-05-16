package database

// Xóa nhóm mock API và tất cả mock API thuộc nhóm đó
func DeleteMockGroup(id string) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	// Sử dụng transaction để đảm bảo xóa sạch cả 2
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	// 1. Xóa các mock api thuộc nhóm bằng subquery (Xử lý hoàn toàn ở SQL)
	sqlDeleteItems := `
		DELETE FROM 
			td_api_mock 
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
			td_api_mock_group 
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
