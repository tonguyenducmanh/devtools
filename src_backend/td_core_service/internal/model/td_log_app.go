package model

// param log db
type TDLogApp struct {
	ID          string `json:"id"`
	Level	string `json:"level"`
	LogData string `json:"log_data"`
}
