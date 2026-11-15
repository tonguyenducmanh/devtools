package model

// TMDuckDBSession là model cho bảng tm_duckdb_session.
// Mỗi session là 1 in-memory DuckDB database độc lập.
type TMDuckDBSession struct {
	TMBaseModel
	SessionName string `json:"session_name"`
}

func (m TMDuckDBSession) TableName() string {
	return "tm_duckdb_session"
}

// TMDuckDBSessionFile là model cho bảng tm_duckdb_session_file.
// Lưu danh sách file đã nạp vào session, mỗi file tương ứng 1 view/table trong DuckDB.
type TMDuckDBSessionFile struct {
	TMBaseModel
	SessionID string `json:"session_id"`
	FileName  string `json:"file_name"`
	ViewName  string `json:"table_name"` // tên view trong DuckDB (json key giữ table_name để tương thích API)
}

func (m TMDuckDBSessionFile) TableName() string {
	return "tm_duckdb_session_file"
}

// GetGroupID thực hiện interface GroupItemModel để tương thích với CRUD generic nếu cần.
func (m TMDuckDBSessionFile) GetGroupID() string {
	return m.SessionID
}

// TMDuckDBQueryRequest là request body khi frontend gửi câu SQL để thực thi.
type TMDuckDBQueryRequest struct {
	SessionID    string `json:"session_id"`
	SQL          string `json:"sql"`
	DefaultLimit int    `json:"default_limit"`
	Unlimited    bool   `json:"unlimited"`
}

// TMDuckDBFileInfo trả về thông tin file sau khi upload thành công.
type TMDuckDBFileInfo struct {
	TableName string   `json:"table_name"`
	FileName  string   `json:"file_name"`
	Columns   []string `json:"columns"`
	RowCount  int64    `json:"row_count"`
	FileID    string   `json:"file_id"`
}
