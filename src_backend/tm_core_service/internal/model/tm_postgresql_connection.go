package model

// model cho database PostgreSQL connection group.
// Dùng chung TMGroupModel với các bảng group khác (id, name, created_date, modified_date)
type TMPostgreSQLConnectionGroup struct {
	TMGroupModel
}

func (g TMPostgreSQLConnectionGroup) TableName() string {
	return "tm_postgresql_connection_group"
}

// model cho database PostgreSQL connection
type TMPostgreSQLConnection struct {
	TMBaseModel
	ConnectionName   string `json:"connection_name"`
	GroupID          string `json:"group_id"`
	ConnectionString string `json:"connection_string"`
	ConnectType      int    `json:"connect_type"`
}

func (m TMPostgreSQLConnection) TableName() string {
	return "tm_postgresql_connection"
}

// GetGroupID trả về id của nhóm chứa connection này, rỗng nghĩa là chưa gán nhóm
func (m TMPostgreSQLConnection) GetGroupID() string {
	return m.GroupID
}
