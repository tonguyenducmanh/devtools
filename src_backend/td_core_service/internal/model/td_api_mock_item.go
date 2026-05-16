package model

// param api mock muốn tạo
type TDAPIMockItem struct {
	ID           string `json:"id"`
	RequestName  string `json:"request_name"`
	GroupID      string `json:"group_id"`
	Method       string `json:"method"`
	Endpoint     string `json:"end_point"`
	BodyText     string `json:"body_text"`
	ResponeText  string `json:"response_text"`
	CreatedDate  string `json:"created_date,omitempty"`
	ModifiedDate string `json:"modified_date,omitempty"`
}

func (m TDAPIMockItem) TableName() string {
	return "td_api_mock"
}

func (m TDAPIMockItem) PrimaryKey() string {
	return "id"
}

// model quản lý nhóm của api mock
type TDAPIMockGroup struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	CreatedDate  string `json:"created_date,omitempty"`
	ModifiedDate string `json:"modified_date,omitempty"`
}

func (g TDAPIMockGroup) TableName() string {
	return "td_api_mock_group"
}

func (g TDAPIMockGroup) PrimaryKey() string {
	return "id"
}
