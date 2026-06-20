package model

// model cho database PostgreSQL connection
type TDPostgreSQLConnection struct {
	TDBaseModel
	ConnectionName   string `json:"connection_name"`
	ConnectionString string `json:"connection_string"`
	ConnectType      string `json:"connect_type"`
}

func (m TDPostgreSQLConnection) TableName() string {
	return "td_postgresql_connection"
}
