package model

type UIRequest struct {
	ApiURL      string `json:"apiUrl"`
	HttpMethod  string `json:"httpMethod"`
	HeadersText string `json:"headersText"`
	BodyText    string `json:"bodyText"`
}
