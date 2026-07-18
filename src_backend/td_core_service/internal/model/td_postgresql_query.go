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
	DefaultLimit int    `json:"default_limit"`
	Unlimited    bool   `json:"unlimited"`
}

// TDPgDatabaseOpsRequest là request body cho các thao tác backup/restore/clone database
type TDPgDatabaseOpsRequest struct {
	Operation string `json:"operation"` // "backup", "restore", "clone"

	// Connection fields cho nguồn (backup: nguồn, clone: nguồn)
	SourceHost     string `json:"source_host"`
	SourcePort     string `json:"source_port"`
	SourceUser     string `json:"source_user"`
	SourcePassword string `json:"source_password"`
	SourceDB       string `json:"source_db"`

	// Connection fields cho đích (clone: đích)
	TargetHost     string `json:"target_host,omitempty"`
	TargetPort     string `json:"target_port,omitempty"`
	TargetUser     string `json:"target_user,omitempty"`
	TargetPassword string `json:"target_password,omitempty"`
	TargetDB       string `json:"target_db,omitempty"`

	// Đường dẫn tới thư mục chứa pg_dump/psql/pg_restore (nếu rỗng sẽ tìm trong PATH)
	PgBinPath string `json:"pg_bin_path,omitempty"`
}
