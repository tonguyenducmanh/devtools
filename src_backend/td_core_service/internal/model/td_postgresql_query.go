package model

// TDQueryResult chứa kết quả trả về từ 1 statement trong số nhiều statement của 1 script SQL
type TDQueryResult struct {
	Columns      []string         `json:"columns"`
	TableNames   []string         `json:"table_names"` // tên bảng nguồn của từng cột (rỗng nếu cột không gắn trực tiếp với 1 bảng, vd: cột tính toán/alias)
	Rows         []map[string]any `json:"rows"`
	RowsAffected int64            `json:"rows_affected"`
	IsSelect     bool             `json:"is_select"`
}

// TDMultiQueryResult bọc danh sách kết quả của 1 script (có thể gồm nhiều statement cách nhau bởi ";")
// Mỗi phần tử trong Results tương ứng với 1 statement, theo đúng thứ tự thực thi.
type TDMultiQueryResult struct {
	Results []*TDQueryResult `json:"results"`
}

// request body cho connection tới 1 db PostgreSQL
type TDPostgeSQLRequest struct {
	ConnectionID string `json:"connection_id"`
	SQL          string `json:"sql"`
}
