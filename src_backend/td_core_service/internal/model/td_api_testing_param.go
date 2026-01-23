package model

/**
 * param api gọi từ frontend
 */
type TDAPITestingParam struct {
	ApiURL      string `json:"api_url" binding:"required"`
	HttpMethod  string `json:"http_method" binding:"required"`
	HeadersText string `json:"headers_text"`
	BodyText    string `json:"body_text"`
}
