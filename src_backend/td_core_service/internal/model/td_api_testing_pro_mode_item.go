package model

// model quản lý item api testing promode (lưu tên script và nội dung javascript)
type TDAPITestingProModeItem struct {
	TDBaseModel
	RequestName string `json:"request_name"`
	GroupID     string `json:"group_id"`
	ScriptCode  string `json:"script_code"`
}

func (m TDAPITestingProModeItem) TableName() string {
	return "td_api_testing_pro_mode"
}

// GetGroupID trả về id của nhóm chứa script này, rỗng nghĩa là chưa gán nhóm
func (m TDAPITestingProModeItem) GetGroupID() string {
	return m.GroupID
}

// model quản lý nhóm của api testing promode.
// Dùng chung TDGroupModel với các bảng group khác (id, name, created_date, modified_date)
type TDAPITestingProModeGroup struct {
	TDGroupModel
}

func (g TDAPITestingProModeGroup) TableName() string {
	return "td_api_testing_pro_mode_group"
}

// model import batch cho promode
type TDAPITestingProModeImportBatch struct {
	Groups []TDAPITestingProModeGroup `json:"groups"`
	Items  []TDAPITestingProModeItem  `json:"items"`
}
