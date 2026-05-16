package model

// model quản lý item api testing
type TDAPITestingItem struct {
	ID           string `json:"id"`
	RequestName  string `json:"request_name"`
	GroupID      string `json:"group_id"`
	Method       string `json:"method"`
	Endpoint     string `json:"end_point"`
	HeadersText  string `json:"headers_text"`
	BodyText     string `json:"body_text"`
	CreatedDate  string `json:"created_date,omitempty"`
	ModifiedDate string `json:"modified_date,omitempty"`
}

func (m TDAPITestingItem) TableName() string {
	return "td_api_testing"
}

func (m TDAPITestingItem) PrimaryKey() string {
	return "id"
}

// model quản lý nhóm của api testing
type TDAPITestingGroup struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	CreatedDate  string `json:"created_date,omitempty"`
	ModifiedDate string `json:"modified_date,omitempty"`
}

func (g TDAPITestingGroup) TableName() string {
	return "td_api_testing_group"
}

func (g TDAPITestingGroup) PrimaryKey() string {
	return "id"
}

// model import batch
type TDAPITestingImportBatch struct {
	Groups []TDAPITestingGroup `json:"groups"`
	Items  []TDAPITestingItem  `json:"items"`
}
