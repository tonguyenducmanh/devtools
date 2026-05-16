package model

// param api mock muốn tạo
type TDAPIMockItem struct {
	TDBaseModel
	RequestName string `json:"request_name"`
	GroupID     string `json:"group_id"`
	Method      string `json:"method"`
	Endpoint    string `json:"end_point"`
	BodyText    string `json:"body_text"`
	ResponeText string `json:"response_text"`
}

func (m TDAPIMockItem) TableName() string {
	return "td_api_mock"
}

// model quản lý nhóm của api mock
type TDAPIMockGroup struct {
	TDBaseModel
	Name string `json:"name"`
}

func (g TDAPIMockGroup) TableName() string {
	return "td_api_mock_group"
}
