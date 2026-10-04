package model

// TMBaseModel là struct nền tảng cho tất cả các model lưu vào database.
// Embed struct này vào model cụ thể giống như kế thừa class base trong C#.
// BaseRepository sẽ tự xử lý ID (auto-gen UUID), created_date, modified_date.
type TMBaseModel struct {
	ID           string `json:"id"`
	CreatedDate  string `json:"created_date,omitempty"`
	ModifiedDate string `json:"modified_date,omitempty"`
}

func (m TMBaseModel) PrimaryKey() string {
	return "id"
}

// GetID trả về giá trị khóa chính hiện tại.
// Cần cho các thao tác generic (vd: index group theo id khi gom cây master-detail).
func (m TMBaseModel) GetID() string {
	return m.ID
}
