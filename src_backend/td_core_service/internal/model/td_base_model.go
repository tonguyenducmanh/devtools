package model

// TDBaseModel là struct nền tảng cho tất cả các model lưu vào database.
// Embed struct này vào model cụ thể giống như kế thừa class base trong C#.
// BaseRepository sẽ tự xử lý ID (auto-gen UUID), created_date, modified_date.
type TDBaseModel struct {
	ID           string `json:"id"`
	CreatedDate  string `json:"created_date,omitempty"`
	ModifiedDate string `json:"modified_date,omitempty"`
}

func (m TDBaseModel) PrimaryKey() string {
	return "id"
}
