// Package duckdb cung cấp tầng data access cho DuckDB in-memory sessions.
//
// Mỗi session là 1 *sql.DB kết nối đến 1 in-memory DuckDB database độc lập.
// Session được lưu trong sync.Map (keyed by session_id) và tồn tại đến khi daemon tắt
// hoặc người dùng xoá session.
//
// File/table lifecycle:
//   - Upload file → lưu tạm vào OS temp dir → CREATE VIEW table_name AS SELECT * FROM read_...()
//   - View này tồn tại đến khi session bị xoá
//   - File tạm không tự dọn (daemon sẽ dọn khi tắt qua defer hoặc OS dọn tmp)

package duckdb

import (
	"context"
	"database/sql"
	"fmt"
	"path/filepath"
	"strings"
	"sync"

	_ "github.com/duckdb/duckdb-go/v2"
	"tm_core_service/internal/model"
	"tm_core_service/tm_common"
)

// sessionStore giữ toàn bộ DuckDB in-memory connections, keyed by session_id.
var sessionStore sync.Map

// duckdbSession wraps 1 *sql.DB kết nối DuckDB + danh sách file đã nạp.
type duckdbSession struct {
	db    *sql.DB
	mu    sync.Mutex
	files []loadedFile
}

// loadedFile lưu thông tin 1 file đã nạp vào session.
type loadedFile struct {
	FileID    string
	FileName  string
	TableName string
	FilePath  string
	// RowCount là số dòng đếm được lúc nạp file (dùng để hiển thị ở sidebar).
	RowCount int64
}

// DefaultQueryLimit là giới hạn số dòng khi frontend không gửi default_limit.
const DefaultQueryLimit = 1000

// getOrCreateSession lấy session hiện có hoặc tạo mới nếu chưa có.
func getOrCreateSession(sessionID string) (*duckdbSession, error) {
	if v, ok := sessionStore.Load(sessionID); ok {
		return v.(*duckdbSession), nil
	}

	// Tạo in-memory DuckDB mới
	db, err := sql.Open("duckdb", "")
	if err != nil {
		return nil, fmt.Errorf("tạo DuckDB session thất bại: %w", err)
	}

	// Mỗi session chạy trên 1 connection duy nhất để giữ trạng thái
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	sess := &duckdbSession{db: db}
	sessionStore.Store(sessionID, sess)
	return sess, nil
}

// GetOrCreateSession tạo hoặc lấy session in-memory DuckDB theo session_id.
// Hàm này public để service layer gọi.
func GetOrCreateSession(sessionID string) (*duckdbSession, error) {
	return getOrCreateSession(sessionID)
}

// LoadFile nạp file vào session DuckDB dưới dạng view.
// Hỗ trợ: .xlsx, .xls, .csv, .parquet, .json, .ndjson.
// tableName sẽ là tên view trong DuckDB để query.
func LoadFile(sessionID, filePath, tableName, fileID, fileName string) ([]string, int64, error) {
	sess, err := getOrCreateSession(sessionID)
	if err != nil {
		return nil, 0, err
	}

	sess.mu.Lock()
	defer sess.mu.Unlock()

	ext := strings.ToLower(filepath.Ext(filePath))

	var readExpr string
	switch ext {
	case ".xlsx", ".xls":
		// Cần extension excel của DuckDB
		if _, err2 := sess.db.Exec("INSTALL excel; LOAD excel;"); err2 != nil {
			// Có thể đã install rồi, bỏ qua lỗi "already loaded"
			tm_common.LogInfo(fmt.Sprintf("DuckDB INSTALL excel info: %v", err2))
		}
		readExpr = fmt.Sprintf("read_xlsx('%s')", escapeSingleQuote(filePath))
	case ".csv", ".tsv":
		readExpr = fmt.Sprintf("read_csv_auto('%s')", escapeSingleQuote(filePath))
	case ".parquet":
		readExpr = fmt.Sprintf("read_parquet('%s')", escapeSingleQuote(filePath))
	case ".json":
		readExpr = fmt.Sprintf("read_json_auto('%s')", escapeSingleQuote(filePath))
	case ".ndjson", ".jsonl":
		readExpr = fmt.Sprintf("read_ndjson_auto('%s')", escapeSingleQuote(filePath))
	default:
		return nil, 0, fmt.Errorf("định dạng file không hỗ trợ: %s", ext)
	}

	// Xoá view cũ nếu tồn tại (tên trùng)
	_, _ = sess.db.Exec(fmt.Sprintf("DROP VIEW IF EXISTS \"%s\"", escapeDQ(tableName)))

	// Tạo view mới
	createSQL := fmt.Sprintf("CREATE VIEW \"%s\" AS SELECT * FROM %s", escapeDQ(tableName), readExpr)
	if _, err2 := sess.db.Exec(createSQL); err2 != nil {
		return nil, 0, fmt.Errorf("tạo view thất bại: %w", err2)
	}

	// Lấy danh sách cột
	columns, rowCount, err2 := describeView(sess.db, tableName)
	if err2 != nil {
		return nil, 0, err2
	}

	// Lưu thông tin file vào session
	sess.files = append(sess.files, loadedFile{
		FileID:    fileID,
		FileName:  fileName,
		TableName: tableName,
		FilePath:  filePath,
		RowCount:  rowCount,
	})

	return columns, rowCount, nil
}

// describeView trả về danh sách column và rowCount của view.
func describeView(db *sql.DB, tableName string) ([]string, int64, error) {
	ctx := context.Background()

	// Lấy danh sách cột
	rows, err := db.QueryContext(ctx, fmt.Sprintf("DESCRIBE \"%s\"", escapeDQ(tableName)))
	if err != nil {
		return nil, 0, fmt.Errorf("DESCRIBE view thất bại: %w", err)
	}
	defer rows.Close()

	var columns []string
	for rows.Next() {
		var colName, colType string
		var nullable, key, defaultVal, extra interface{}
		if err2 := rows.Scan(&colName, &colType, &nullable, &key, &defaultVal, &extra); err2 != nil {
			// fallback: scan ít cột hơn
			break
		}
		columns = append(columns, colName)
	}
	rows.Close()

	if len(columns) == 0 {
		// Dùng SELECT * LIMIT 0 để lấy tên cột
		cols, err2 := getColumnsFromSelect(db, tableName)
		if err2 != nil {
			return nil, 0, err2
		}
		columns = cols
	}

	// Đếm số dòng (gần đúng, không ảnh hưởng chức năng chính)
	var rowCount int64
	row := db.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM \"%s\"", escapeDQ(tableName)))
	_ = row.Scan(&rowCount)

	return columns, rowCount, nil
}

// getColumnsFromSelect lấy tên cột bằng cách SELECT * LIMIT 0.
func getColumnsFromSelect(db *sql.DB, tableName string) ([]string, error) {
	rows, err := db.QueryContext(context.Background(), fmt.Sprintf("SELECT * FROM \"%s\" LIMIT 0", escapeDQ(tableName)))
	if err != nil {
		return nil, fmt.Errorf("đọc cột thất bại: %w", err)
	}
	defer rows.Close()
	return rows.Columns()
}

// ExecuteQuery thực thi SQL script trên session DuckDB và trả về kết quả.
// Hỗ trợ nhiều statement cách nhau bởi dấu ";".
func ExecuteQuery(sessionID, sqlQuery string, defaultLimit int, unlimited bool) (*model.TMMultiQueryResult, error) {
	sess, err := getOrCreateSession(sessionID)
	if err != nil {
		return nil, err
	}

	sess.mu.Lock()
	defer sess.mu.Unlock()

	if unlimited {
		defaultLimit = 0
	} else if defaultLimit <= 0 {
		defaultLimit = DefaultQueryLimit
	}

	// Tách các statement
	statements := splitStatements(sqlQuery)
	result := &model.TMMultiQueryResult{
		Results: make([]*model.TMQueryResult, 0, len(statements)),
	}

	ctx := context.Background()

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		qr, err2 := executeOneStatement(ctx, sess.db, stmt, defaultLimit)
		if err2 != nil {
			return result, err2
		}
		if qr != nil {
			result.Results = append(result.Results, qr)
		}
	}

	return result, nil
}

// executeOneStatement thực thi 1 câu SQL và trả về TMQueryResult.
func executeOneStatement(ctx context.Context, db *sql.DB, stmt string, limit int) (*model.TMQueryResult, error) {
	// Xác định SELECT hay DML
	upperStmt := strings.ToUpper(strings.TrimSpace(stmt))
	isSelect := strings.HasPrefix(upperStmt, "SELECT") ||
		strings.HasPrefix(upperStmt, "WITH") ||
		strings.HasPrefix(upperStmt, "SHOW") ||
		strings.HasPrefix(upperStmt, "DESCRIBE") ||
		strings.HasPrefix(upperStmt, "EXPLAIN") ||
		strings.HasPrefix(upperStmt, "PRAGMA")

	if isSelect {
		// Áp dụng LIMIT nếu cần
		execStmt := stmt
		if limit > 0 && !strings.Contains(upperStmt, " LIMIT ") {
			execStmt = fmt.Sprintf("SELECT * FROM (%s) __duckdb_wrapped LIMIT %d", stmt, limit)
		}

		rows, err := db.QueryContext(ctx, execStmt)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		cols, err := rows.Columns()
		if err != nil {
			return nil, err
		}

		var resultRows []map[string]any
		for rows.Next() {
			vals := make([]interface{}, len(cols))
			valPtrs := make([]interface{}, len(cols))
			for i := range vals {
				valPtrs[i] = &vals[i]
			}
			if err2 := rows.Scan(valPtrs...); err2 != nil {
				continue
			}
			row := make(map[string]any, len(cols))
			for i, col := range cols {
				row[col] = formatValue(vals[i])
			}
			resultRows = append(resultRows, row)
		}

		tableNames := make([]string, len(cols))

		return &model.TMQueryResult{
			Columns:    cols,
			TableNames: tableNames,
			Rows:       resultRows,
			IsSelect:   true,
		}, nil
	}

	// DML: INSERT/UPDATE/DELETE/CREATE/DROP v.v.
	sqlResult, err := db.ExecContext(ctx, stmt)
	if err != nil {
		return nil, err
	}
	rowsAffected, _ := sqlResult.RowsAffected()
	return &model.TMQueryResult{
		RowsAffected: rowsAffected,
		IsSelect:     false,
	}, nil
}

// formatValue chuyển kiểu Go sang kiểu JSON-friendly.
func formatValue(v interface{}) interface{} {
	if v == nil {
		return nil
	}
	switch val := v.(type) {
	case []byte:
		return string(val)
	default:
		return val
	}
}

// GetSessionFiles trả về danh sách file đã nạp trong session.
func GetSessionFiles(sessionID string) []loadedFile {
	v, ok := sessionStore.Load(sessionID)
	if !ok {
		return nil
	}
	sess := v.(*duckdbSession)
	sess.mu.Lock()
	defer sess.mu.Unlock()
	result := make([]loadedFile, len(sess.files))
	copy(result, sess.files)
	return result
}

// DropFile xoá 1 view/table khỏi session.
func DropFile(sessionID, tableNameOrFileID string) error {
	v, ok := sessionStore.Load(sessionID)
	if !ok {
		return nil
	}
	sess := v.(*duckdbSession)
	sess.mu.Lock()
	defer sess.mu.Unlock()

	// Tìm file theo fileID hoặc tableName
	newFiles := sess.files[:0]
	var dropped string
	for _, f := range sess.files {
		if f.FileID == tableNameOrFileID || f.TableName == tableNameOrFileID {
			dropped = f.TableName
		} else {
			newFiles = append(newFiles, f)
		}
	}
	if dropped != "" {
		_, _ = sess.db.Exec(fmt.Sprintf("DROP VIEW IF EXISTS \"%s\"", escapeDQ(dropped)))
		sess.files = newFiles
	}
	return nil
}

// DropSession xoá session khỏi memory và đóng DuckDB connection.
func DropSession(sessionID string) {
	v, ok := sessionStore.LoadAndDelete(sessionID)
	if !ok {
		return
	}
	sess := v.(*duckdbSession)
	sess.mu.Lock()
	defer sess.mu.Unlock()
	if sess.db != nil {
		_ = sess.db.Close()
	}
}

// splitStatements tách script SQL thành từng statement theo dấu ";".
func splitStatements(script string) []string {
	var stmts []string
	var cur strings.Builder
	inSingleQuote := false

	for i := 0; i < len(script); i++ {
		ch := script[i]
		if ch == '\'' {
			inSingleQuote = !inSingleQuote
		}
		if ch == ';' && !inSingleQuote {
			s := strings.TrimSpace(cur.String())
			if s != "" {
				stmts = append(stmts, s)
			}
			cur.Reset()
			continue
		}
		cur.WriteByte(ch)
	}
	if s := strings.TrimSpace(cur.String()); s != "" {
		stmts = append(stmts, s)
	}
	return stmts
}

// escapeSingleQuote escape dấu ' trong tên file path.
func escapeSingleQuote(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}

// escapeDQ escape dấu " trong tên identifier.
func escapeDQ(s string) string {
	return strings.ReplaceAll(s, "\"", "\"\"")
}
