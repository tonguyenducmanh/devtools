package model

// TDAPITestingFormField là 1 field của body dạng multipart/form-data,
// dùng chung với api mocking nên chỉ khai báo alias
type TDAPITestingFormField = TDAPIFormField

// param api gọi từ frontend
type TDAPITestingParam struct {
	ApiURL      string `json:"api_url" binding:"required"`
	HttpMethod  string `json:"http_method" binding:"required"`
	HeadersText string `json:"headers_text"`
	BodyText    string `json:"body_text"`
	// BodyType là kiểu body gửi lên, để trống sẽ coi như json
	BodyType string `json:"body_type"`
	// FormData là các field của body dạng multipart/form-data
	FormData []TDAPITestingFormField `json:"form_data"`
}

// IsFormData kiểm tra body có phải multipart/form-data không
func (p TDAPITestingParam) IsFormData() bool {
	return p.BodyType == TDAPIBodyTypeFormData
}
