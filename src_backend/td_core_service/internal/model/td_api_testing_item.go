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
}

func (m TDAPITestingItem) TableName() string {
	return "td_api_testing"
}

// model quản lý nhóm của api testing
type TDAPITestingGroup struct {
	TDBaseModel
	Name string `json:"name"`
}

func (g TDAPITestingGroup) TableName() string {
	return "td_api_testing_group"
}

// model import batch
type TDAPITestingImportBatch struct {
	Groups []TDAPITestingGroup `json:"groups"`
	Items  []TDAPITestingItem  `json:"items"`
}
