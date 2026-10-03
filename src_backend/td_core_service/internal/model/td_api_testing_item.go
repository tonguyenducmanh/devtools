package model

// model quản lý item api testing
type TDAPITestingItem struct {
	TDBaseModel
	RequestName string `json:"request_name"`
	GroupID     string `json:"group_id"`
	Method      string `json:"method"`
	Endpoint    string `json:"end_point"`
	HeadersText string `json:"headers_text"`
	BodyText    string `json:"body_text"`
	// BodyType là kiểu body: json hoặc form_data
	BodyType string `json:"body_type"`
	// FormDataText là danh sách field của body form_data, lưu dạng json
	// không lưu nội dung file (base64) vì quá nặng, chỉ lưu tên file và kiểu
	FormDataText string `json:"form_data_text"`
}

func (m TDAPITestingItem) TableName() string {
	return "td_api_testing"
}

// GetGroupID trả về id của nhóm chứa request này, rỗng nghĩa là chưa gán nhóm
func (m TDAPITestingItem) GetGroupID() string {
	return m.GroupID
}

// model quản lý nhóm của api testing.
// Dùng chung TDGroupModel với các bảng group khác (id, name, created_date, modified_date)
type TDAPITestingGroup struct {
	TDGroupModel
}

func (g TDAPITestingGroup) TableName() string {
	return "td_api_testing_group"
}

// model import batch
type TDAPITestingImportBatch struct {
	Groups []TDAPITestingGroup `json:"groups"`
	Items  []TDAPITestingItem  `json:"items"`
}
