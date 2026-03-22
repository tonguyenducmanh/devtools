package model

// model cho RDP connection
type TDRDPConnection struct {
	ID             string `json:"id"`
	ConnectionName string `json:"connection_name"`
	Host           string `json:"host"`
	Username       string `json:"username"`
	Password       string `json:"password"`
}
