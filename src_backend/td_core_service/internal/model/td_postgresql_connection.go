package model

// model cho database PostgreSQL connection group.
// Dùng chung TDGroupModel với các bảng group khác (id, name, created_date, modified_date)
type TDPostgreSQLConnectionGroup struct {
	TDGroupModel
}

func (g TDPostgreSQLConnectionGroup) TableName() string {
	return "td_postgresql_connection_group"
}

// model cho database PostgreSQL connection
type TDPostgreSQLConnection struct {
	TDBaseModel
	ConnectionName   string `json:"connection_name"`
	GroupID          string `json:"group_id"`
	ConnectionString string `json:"connection_string"`
	ConnectType      int    `json:"connect_type"`
}

func (m TDPostgreSQLConnection) TableName() string {
	return "td_postgresql_connection"
}

// GetGroupID trả về id của nhóm chứa connection này, rỗng nghĩa là chưa gán nhóm
func (m TDPostgreSQLConnection) GetGroupID() string {
	return m.GroupID
}
