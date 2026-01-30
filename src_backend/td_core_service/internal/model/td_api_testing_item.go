package model

/**
 * model quản lý item api testing
 */
type TDAPITestingItem struct {
	ID          string `json:"id"`
	RequestName string `json:"request_name"`
	GroupID     string `json:"group_id"`
	Method      string `json:"method"`
	Endpoint    string `json:"end_point"`
	HeadersText string `json:"headers_text"`
	BodyText    string `json:"body_text"`
}

/**
 * model quản lý nhóm của api testing
 */
type TDAPITestingGroup struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

/**
 * model import batch
 */
type TDAPITestingImportBatch struct {
	Groups []TDAPITestingGroup `json:"groups"`
	Items  []TDAPITestingItem  `json:"items"`
}
