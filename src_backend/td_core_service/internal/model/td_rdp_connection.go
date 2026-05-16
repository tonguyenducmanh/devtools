package model

// model cho RDP connection
type TDRDPConnection struct {
	TDBaseModel
	ConnectionName string `json:"connection_name"`
	Host           string `json:"host"`
	Username       string `json:"username"`
	Password       string `json:"password"`
}

func (m TDRDPConnection) TableName() string {
	return "td_rdp_connection"
}
