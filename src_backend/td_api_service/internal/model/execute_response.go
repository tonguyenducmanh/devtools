package model

type ExecuteResponse struct {
	Status  int    `json:"status"`
	Headers string `json:"headers"`
	Body    string `json:"body"`
}
