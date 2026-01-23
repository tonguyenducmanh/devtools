package model

/**
 * response cho api mà frontend muốn gọi nối
 */
type ExecuteResponse struct {
	Status  int    `json:"status"`
	Headers string `json:"headers"`
	Body    string `json:"body"`
}
