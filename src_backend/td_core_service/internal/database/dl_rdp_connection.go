package database

import (
	"td_core_service/internal/model"
)

// Lấy tất cả RDP connections từ database
func GetAllRDPConnections() ([]model.TDRDPConnection, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	sqlQuery := `
		SELECT 
			id, 
			connection_name, 
			host, 
			username, 
			password
		FROM 
			td_rdp_connection 
		ORDER BY 
			created_date DESC
	`
	rows, err := db.Query(sqlQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var connections []model.TDRDPConnection
	for rows.Next() {
		var conn model.TDRDPConnection
		err := rows.Scan(&conn.ID, &conn.ConnectionName, &conn.Host, &conn.Username, &conn.Password)
		if err != nil {
			continue
		}
		connections = append(connections, conn)
	}

	return connections, nil
}

// Tạo RDP connection mới trong database
func CreateRDPConnection(conn *model.TDRDPConnection) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	sqlQuery := `
		INSERT INTO td_rdp_connection (
			id, 
			connection_name, 
			host, 
			username, 
			password
		)
		VALUES (
			?, ?, ?, ?, ?
		)
	`
	_, err = db.Exec(sqlQuery, conn.ID, conn.ConnectionName, conn.Host, conn.Username, conn.Password)

	return err
}

// Cập nhật RDP connection trong database
func UpdateRDPConnection(conn *model.TDRDPConnection) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sqlQuery := `
		UPDATE 
			td_rdp_connection 
		SET 
			connection_name = ?, 
			host = ?, 
			username = ?, 
			password = ?, 
			modified_date = CURRENT_TIMESTAMP
		WHERE 
			id = ?
	`

	result, err := db.Exec(sqlQuery, conn.ConnectionName, conn.Host, conn.Username, conn.Password, conn.ID)

	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// Xóa RDP connection khỏi database
func DeleteRDPConnection(id string) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sqlQuery := `
		DELETE FROM 
			td_rdp_connection 
		WHERE 
			id = ?
	`
	result, err := db.Exec(sqlQuery, id)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}
