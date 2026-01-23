package model

type APIResponse struct {
	Status     int                 `json:"status"`
	StatusText string              `json:"statusText"`
	Headers    map[string][]string `json:"headers,omitempty"`
	Body       string              `json:"body"`
}
