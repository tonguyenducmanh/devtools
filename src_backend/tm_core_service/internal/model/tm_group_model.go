package model

// TMGroupModel là struct nền tảng cho toàn bộ bảng "master" trong mô hình master-detail
// (group - item) của app: mock api, api testing, pro mode, postgresql connection, rdp connection.
//
// Mọi bảng group đều có cùng cấu trúc: id, name, created_date, modified_date.
// Embed struct này vào model group cụ thể thay vì khai báo lại TMBaseModel + Name,
// nhờ đó generic collection controller chỉ cần biết TableName() là xử lý được tất cả.
//
//   type TMAPIMockGroup struct {
//       TMGroupModel
//   }
//
//   func (g TMAPIMockGroup) TableName() string { return "tm_api_mock_group" }
//
// Về id: group LUÔN có id, kế thừa từ TMBaseModel. TMDLBase.Insert tự sinh UUID khi
// id rỗng, nên không cần truyền id khi tạo group. Ràng buộc "group phải có id" được
// compiler ép buộc qua interface database.TMGroup (bắt buộc có GetID()).
type TMGroupModel struct {
	TMBaseModel
	// Name là tên hiển thị của nhóm trên UI
	Name string `json:"name"`
}

// GetName trả về tên hiển thị của nhóm
func (m TMGroupModel) GetName() string {
	return m.Name
}