package model

// TDGroupModel là struct nền tảng cho toàn bộ bảng "master" trong mô hình master-detail
// (group - item) của app: mock api, api testing, pro mode, postgresql connection, rdp connection.
//
// Mọi bảng group đều có cùng cấu trúc: id, name, created_date, modified_date.
// Embed struct này vào model group cụ thể thay vì khai báo lại TDBaseModel + Name,
// nhờ đó generic collection controller chỉ cần biết TableName() là xử lý được tất cả.
//
//   type TDAPIMockGroup struct {
//       TDGroupModel
//   }
//
//   func (g TDAPIMockGroup) TableName() string { return "td_api_mock_group" }
//
// Về id: group LUÔN có id, kế thừa từ TDBaseModel. TDDLBase.Insert tự sinh UUID khi
// id rỗng, nên không cần truyền id khi tạo group. Ràng buộc "group phải có id" được
// compiler ép buộc qua interface database.TDGroup (bắt buộc có GetID()).
type TDGroupModel struct {
	TDBaseModel
	// Name là tên hiển thị của nhóm trên UI
	Name string `json:"name"`
}

// GetName trả về tên hiển thị của nhóm
func (m TDGroupModel) GetName() string {
	return m.Name
}