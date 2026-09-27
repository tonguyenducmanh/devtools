package model

// kiểu body của request api testing
const (
	TDAPIBodyTypeJSON     = "json"
	TDAPIBodyTypeFormData = "form_data"
)

// kiểu của 1 field trong body multipart/form-data
const (
	TDAPIFormFieldTypeText = "text"
	TDAPIFormFieldTypeFile = "file"
)

// TDAPITestingFormField là 1 field của body dạng multipart/form-data, có thể là text hoặc file
type TDAPITestingFormField struct {
	Key             string `json:"key"`
	Value           string `json:"value"`
	Type            string `json:"type"`
	FileName        string `json:"file_name"`
	FileContentType string `json:"file_content_type"`
	// nội dung file dạng base64, frontend đọc file local rồi gửi lên agent
	FileContent string `json:"file_content"`
}

// IsFile kiểm tra field này có phải file hay không
func (f TDAPITestingFormField) IsFile() bool {
	return f.Type == TDAPIFormFieldTypeFile
}

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
