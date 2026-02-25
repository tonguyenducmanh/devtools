package database

import "td_core_service/internal/model"

// Tạo log mới cho app backend
func CreateLogApp(mock *model.TDLogApp) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	sqlQuery := `
		INSERT INTO td_log_app (
			id, 
			level,
			log_data
		)
		VALUES (
			?, ?, ?
		)
	`
	_, err = db.Exec(sqlQuery, mock.ID, mock.Level, mock.LogData)

	return err
}
