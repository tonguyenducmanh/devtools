package model

/**
 * param api mock muốn tạo
 */
type TDAPIMockParam struct {
	RequestName string `json:"request_name"`
	GroupName   string `json:"group_name"`
	Method      string `json:"method"`
	Endpoint    string `json:"end_point"`
	BodyText    string `json:"body_text"`
	ResponeText string `json:"response_text"`
}
