package model

// TDQueryResult chứa kết quả trả về từ một PostgreSQL query
type TDQueryResult struct {
	Columns      []string         `json:"columns"`
	Rows         []map[string]any `json:"rows"`
	RowsAffected int64            `json:"rows_affected"`
	IsSelect     bool             `json:"is_select"`
}

// request body cho test connection tới 1 db PostgreSQL
type TDTestPostgeSQLRequest struct {
	ConnectionString string `json:"connection_string"`
}
