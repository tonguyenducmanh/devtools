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

// model quản lý nhóm của api testing promode
type TDAPITestingProModeGroup struct {
	TDBaseModel
	Name string `json:"name"`
}

func (g TDAPITestingProModeGroup) TableName() string {
	return "td_api_testing_pro_mode_group"
}
