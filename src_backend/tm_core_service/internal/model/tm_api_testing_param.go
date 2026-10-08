package model

// param api gọi từ frontend
type TMAPITestingParam struct {
	ApiURL      string `json:"api_url" binding:"required"`
	HttpMethod  string `json:"http_method" binding:"required"`
	HeadersText string `json:"headers_text"`
	BodyText    string `json:"body_text"`
	// BodyType là kiểu body gửi lên, để trống sẽ coi như json
	BodyType string `json:"body_type"`
	// FormData là các field của body dạng multipart/form-data
	FormData []TMAPIFormField `json:"form_data"`
}

// IsFormData kiểm tra body có phải multipart/form-data không
func (p TMAPITestingParam) IsFormData() bool {
	return p.BodyType == TMAPIBodyTypeFormData
}
