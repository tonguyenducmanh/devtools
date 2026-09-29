package model

// kiểu body của request api
const (
	TDAPIBodyTypeJSON     = "json"
	TDAPIBodyTypeFormData = "form_data"
)

// kiểu của 1 field trong body multipart/form-data
const (
	TDAPIFormFieldTypeText = "text"
	TDAPIFormFieldTypeFile = "file"
)

// TDAPIFormField là 1 field của body dạng multipart/form-data, có thể là text hoặc file.
// Dùng chung cho API testing (dựng request gửi đi) và API mocking (đối chiếu request với mock)
type TDAPIFormField struct {
	Key             string `json:"key"`
	Value           string `json:"value"`
	Type            string `json:"type"`
	FileName        string `json:"file_name"`
	FileContentType string `json:"file_content_type"`
	// nội dung file dạng base64, frontend đọc file local rồi gửi lên agent
	FileContent string `json:"file_content"`
}

// IsFile kiểm tra field này có phải file hay không
func (f TDAPIFormField) IsFile() bool {
	return f.Type == TDAPIFormFieldTypeFile
}

// TDAPIFormFieldSaved là 1 field form data đã lưu xuống database trong form_data_text.
// Frontend ghi json với key camelCase và không lưu nội dung file vì quá nặng
type TDAPIFormFieldSaved struct {
	Key             string `json:"key"`
	Value           string `json:"value"`
	Type            string `json:"type"`
	FileName        string `json:"fileName"`
	FileContentType string `json:"fileContentType"`
}

// IsFile kiểm tra field này có phải file hay không
func (f TDAPIFormFieldSaved) IsFile() bool {
	return f.Type == TDAPIFormFieldTypeFile
}
