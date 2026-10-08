package model

// model quản lý item api testing promode (lưu tên script và nội dung javascript)
type TMAPITestingProModeItem struct {
	TMBaseModel
	RequestName string `json:"request_name"`
	GroupID     string `json:"group_id"`
	ScriptCode  string `json:"script_code"`
}

func (m TMAPITestingProModeItem) TableName() string {
	return "tm_api_testing_pro_mode"
}

// GetGroupID trả về id của nhóm chứa script này, rỗng nghĩa là chưa gán nhóm
func (m TMAPITestingProModeItem) GetGroupID() string {
	return m.GroupID
}

// model quản lý nhóm của api testing promode.
// Dùng chung TMGroupModel với các bảng group khác (id, name, created_date, modified_date)
type TMAPITestingProModeGroup struct {
	TMGroupModel
}

func (g TMAPITestingProModeGroup) TableName() string {
	return "tm_api_testing_pro_mode_group"
}

// model import batch cho promode
type TMAPITestingProModeImportBatch struct {
	Groups []TMAPITestingProModeGroup `json:"groups"`
	Items  []TMAPITestingProModeItem  `json:"items"`
}
