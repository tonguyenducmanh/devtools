package model

// model cho database PostgreSQL connection group
type TDPostgreSQLConnectionGroup struct {
	TDBaseModel
	Name string `json:"name"`
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
