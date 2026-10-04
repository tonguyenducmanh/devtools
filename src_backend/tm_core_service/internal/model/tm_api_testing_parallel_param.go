package model

// param cho execute parallel - mảng các request cần chạy đồng thời
type TMAPITestingParallelParam struct {
	Requests []TMAPITestingParam `json:"requests"`
}

// response cho execute parallel
type TMAPITestingParallelResponse struct {
	Results     []TMAPITestingResponse `json:"results"`
	TotalTimeMs int64                  `json:"total_time_ms"`
}
