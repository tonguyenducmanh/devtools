package model

// param cho execute parallel - mảng các request cần chạy đồng thời
type TDAPITestingParallelParam struct {
	Requests []TDAPITestingParam `json:"requests"`
}

// response cho execute parallel
type TDAPITestingParallelResponse struct {
	Results     []TDAPITestingResponse `json:"results"`
	TotalTimeMs int64                  `json:"total_time_ms"`
}
