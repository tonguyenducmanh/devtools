package model

// model cho RDP connection
type TDRDPConnection struct {
	ID             string `json:"id"`
	ConnectionName string `json:"connection_name"`
	Host           string `json:"host"`
	Username       string `json:"username"`
	Password       string `json:"password"`
	CreatedDate    string `json:"created_date,omitempty"`
	ModifiedDate   string `json:"modified_date,omitempty"`
}

func (m TDRDPConnection) TableName() string {
	return "td_rdp_connection"
}

func (m TDRDPConnection) PrimaryKey() string {
	return "id"
}
