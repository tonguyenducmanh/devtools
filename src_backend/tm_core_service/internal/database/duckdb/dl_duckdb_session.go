// Package duckdb cung cấp tầng data access cho DuckDB qua CLI.
//
// Mỗi session là 1 file .duckdb persistent (temp). Mỗi thao tác (query, upload, drop)
// spawn 1 tiến trình DuckDB CLI với -json -c "<SQL>" — các câu lệnh liên quan được
// gộp thành 1 chuỗi SQL để giảm số lần spawn process.
// Không dùng CGO/libduckdb → build cross-platform được.
//
// Excel/ODS: .xlsx và .ods đọc bằng extension `rusty_sheet` (nhúng sẵn trong binary,
// xem dl_duckdb_spreadsheet.go) → convert mỗi sheet sang parquet tạm → nạp thành view.
// .xls vẫn dùng xlrd-go (rusty_sheet/calamine báo "empty" với nhiều file BIFF8 hợp lệ)
// → convert từng sheet sang CSV tạm → nạp thành view.
// KHÔNG cần INSTALL/tải extension từ internet.
//
// DuckDB CLI binary được nhúng vào Go binary qua //go:embed (folder cli/),
// tải trước bởi scripts/fetch_duckdb_cli.sh. Không commit binary (xem .gitignore).
//
// File/table lifecycle:
//   - Upload file → lưu tạm vào OS temp dir → CREATE VIEW table AS SELECT * FROM read_...()
//   - View tồn tại trong file .duckdb đến khi session bị xoá
//   - File .duckdb session được xoá khi DropSession

package duckdb

import (
	"archive/zip"
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"unicode"
	"unicode/utf8"

	"tm_core_service/internal/model"
	"tm_core_service/tm_common"

	"github.com/yamitzky/xlrd-go/xlrd"
	"golang.org/x/text/unicode/norm"
)

// DefaultQueryLimit là giới hạn số dòng khi frontend không gửi default_limit.
const DefaultQueryLimit = 1000

// duckdbCLICPUHint là thông báo thân thiện khi binary DuckDB CLI không chạy được
// vì CPU thiếu tập lệnh (SIGILL / illegal instruction).
//
// DuckDB từ 2.0.0 build CLI cho linux/windows amd64 với -march=x86-64-v3
// (cần AVX2 + BMI2 + FMA). CPU không có AVX2 (VD Intel Pentium Silver N6005/J5005,
// Xeon E5 v1/v2, VM với CPU model cũ) sẽ crash NGAY lúc khởi động CLI.
// Xem https://github.com/duckdb/duckdb/issues/27691
const duckdbCLICPUHint = "DuckDB CLI không chạy được trên CPU này (illegal instruction / SIGILL): " +
	"binary được build cho x86-64-v3 (cần AVX2) nhưng CPU không hỗ trợ. " +
	"Hãy dùng daemon build với DuckDB CLI v1.5.x (baseline x86-64-v2)."

// cpuUnsupportedError là lỗi riêng cho trường hợp CPU không hỗ trợ binary CLI.
// Dùng để báo lỗi thẳng ra UI mà không bị bọc thêm thông báo chung chung.
type cpuUnsupportedError struct {
	msg string
}

func (e *cpuUnsupportedError) Error() string { return e.msg }

// isIllegalInstruction kiểm tra lỗi exec có phải do CPU không hỗ trợ tập lệnh
// của binary hay không: SIGILL trên Unix, STATUS_ILLEGAL_INSTRUCTION trên Windows.
func isIllegalInstruction(err error) bool {
	var exitErr *exec.ExitError
	if !errors.As(err, &exitErr) {
		return false
	}
	ws, ok := exitErr.Sys().(syscall.WaitStatus)
	if !ok {
		return false
	}
	// Unix: tiến trình bị signal giết.
	if ws.Signaled() && ws.Signal() == syscall.SIGILL {
		return true
	}
	// Windows: 0xC000001D = STATUS_ILLEGAL_INSTRUCTION.
	return ws.ExitStatus() == 3221225501
}

// embeddedCLICache lưu đường dẫn binary duckdb đã ghi ra temp từ embeddedCLIBinary.
var (
	embeddedCLICache string
	embeddedCLIOnce  sync.Once
	embeddedCLIErr   error
)

// getEmbeddedDuckDBCLI ghi binary DuckDB CLI từ embeddedCLIBinary ra file temp,
// trả về đường dẫn file đã có quyền thực thi.
func getEmbeddedDuckDBCLI() (string, error) {
	embeddedCLIOnce.Do(func() {
		if len(embeddedCLIBinary) == 0 {
			embeddedCLIErr = fmt.Errorf("không đọc được CLI embedded (build constraint thiếu?)")
			return
		}

		cacheDir := filepath.Join(os.TempDir(), "devtools-duckdb")
		_ = os.MkdirAll(cacheDir, 0755)

		ext := ""
		if runtime.GOOS == "windows" {
			ext = ".exe"
		}
		outPath := filepath.Join(cacheDir, fmt.Sprintf("duckdb-%s%s", runtime.GOOS, runtime.GOARCH)+ext)
		if err := os.WriteFile(outPath, embeddedCLIBinary, 0755); err != nil {
			embeddedCLIErr = fmt.Errorf("ghi binary DuckDB CLI thất bại: %w", err)
			return
		}

		// Chạy thử CLI 1 lần để phát hiện sớm binary không tương thích CPU
		// (SIGILL do thiếu AVX2) — nếu không, lỗi chỉ lộ ra giữa chừng lúc
		// user đang nạp file, rất khó hiểu.
		if err := probeDuckDBCLI(outPath); err != nil {
			embeddedCLIErr = err
			return
		}

		embeddedCLICache = outPath
		tm_common.LogInfo(fmt.Sprintf("Đã giải nén DuckDB CLI embedded: %s", outPath))
	})
	return embeddedCLICache, embeddedCLIErr
}

// probeDuckDBCLI chạy CLI với "--version" để kiểm tra binary có chạy được
// trên CPU của máy không. Nếu crash vì SIGILL (CPU thiếu AVX2) trả về lỗi
// kèm hướng xử lý rõ ràng.
func probeDuckDBCLI(cliPath string) error {
	cmd := exec.Command(cliPath, "--version")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if isIllegalInstruction(err) {
			return &cpuUnsupportedError{msg: duckdbCLICPUHint}
		}
		return fmt.Errorf("kiểm tra DuckDB CLI thất bại: %w (stderr: %s)", err, stderr.String())
	}
	return nil
}

// platformName ánh xạ GOOS/GOARCH sang tên file embedded (duckdb-<plat> hoặc duckdb-<plat>.exe).
func platformName() string {
	switch runtime.GOOS {
	case "darwin":
		if runtime.GOARCH == "arm64" {
			return "darwin-arm64"
		}
		return "darwin-amd64"
	case "linux":
		if runtime.GOARCH == "arm64" {
			return "linux-arm64"
		}
		return "linux-amd64"
	case "windows":
		return "windows-amd64"
	default:
		return ""
	}
}

// sessionStore giữ toàn bộ session DuckDB, keyed by session_id.
var sessionStore sync.Map

// duckdbSession wraps 1 file .duckdb + danh sách file đã nạp.
type duckdbSession struct {
	dbFile string
	mu     sync.Mutex
	files  []loadedFile
}

// loadedFile lưu thông tin 1 file đã nạp vào session.
type loadedFile struct {
	FileID    string
	FileName  string
	TableName string
	FilePath  string
	RowCount  int64
	Columns   []string
}

// fileLoadResult là kết quả nạp 1 bảng (1 sheet) từ file.
type fileLoadResult struct {
	TableName string
	Columns   []string
	RowCount  int64
	// TempPath là đường dẫn dữ liệu tạm mà view đang đọc (chỉ có với xlsx/xls/ods):
	// thư mục parquet với .xlsx/.ods, file CSV với .xls.
	// View đọc file lazily nên KHÔNG được xoá sớm; sẽ xoá khi drop file/session.
	TempPath string
}

// stagedSheet lưu thông tin 1 sheet đã convert sang dữ liệu tạm đọc được bằng SQL.
type stagedSheet struct {
	SheetName string
	// ReadExpr là biểu thức table function đọc dữ liệu tạm (read_parquet/read_csv).
	ReadExpr string
	// TempPath là thư mục/file tạm cần xoá khi drop (dùng os.RemoveAll).
	TempPath string
}

// runDuckDB spawn 1 tiến trình `duckdb <dbFile> -json -c "<SQL>"`, trả về toàn bộ stdout.
// DuckDB CLI được cài -unsigned để cho phép load extension không ký (rusty_sheet).
func runDuckDB(dbFile, sql string) ([]byte, []byte, error) {
	cliPath, err := getEmbeddedDuckDBCLI()
	if err != nil {
		return nil, nil, err
	}

	cmd := exec.Command(cliPath, dbFile, "-unsigned", "-json", "-c", sql)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err2 := cmd.Run(); err2 != nil {
		// CPU thiếu AVX2 → CLI crash bằng SIGILL, không có stderr nào đọc được.
		// Báo lỗi rõ ràng thay vì "signal: illegal instruction (core dumped)".
		if isIllegalInstruction(err2) {
			return stdout.Bytes(), stderr.Bytes(), &cpuUnsupportedError{msg: duckdbCLICPUHint}
		}
		return stdout.Bytes(), stderr.Bytes(), fmt.Errorf("duckdb CLI lỗi: %w (stderr: %s)", err2, string(stderr.Bytes()))
	}
	return stdout.Bytes(), nil, nil
}

// isSelect kiểm tra xem statement có phải SELECT/WITH/SHOW/DESCRIBE không.
func isSelect(stmt string) bool {
	upper := strings.ToUpper(strings.TrimSpace(stmt))
	return strings.HasPrefix(upper, "SELECT") ||
		strings.HasPrefix(upper, "WITH") ||
		strings.HasPrefix(upper, "SHOW") ||
		strings.HasPrefix(upper, "DESCRIBE") ||
		strings.HasPrefix(upper, "EXPLAIN") ||
		strings.HasPrefix(upper, "PRAGMA")
}

// applyLimit bao bọc SELECT bằng LIMIT nếu cần.
func applyLimit(stmt string, defaultLimit int, unlimited bool) string {
	if unlimited || defaultLimit <= 0 || !isSelect(stmt) {
		return stmt
	}
	upper := strings.ToUpper(stmt)
	if strings.Contains(upper, " LIMIT ") {
		return stmt
	}
	return fmt.Sprintf("SELECT * FROM (%s) __duckdb_wrapped LIMIT %d", stmt, defaultLimit)
}

// parseJSONLines parse nhiều dòng JSON array (mỗi dòng là 1 kết quả) thành danh sách rows.
// Trả về kết quả của dòng JSON cuối cùng có dữ liệu, cột giữ ĐÚNG thứ tự câu SELECT.
func parseJSONLines(stdout []byte) ([]map[string]any, []string, error) {
	lines := strings.Split(string(stdout), "\n")

	// Tìm dòng JSON cuối cùng có dữ liệu (trước dòng rỗng hoặc marker)
	var lastRows []map[string]any
	var lastCols []string

	for _, line := range lines {
		trimmed := bytes.TrimSpace([]byte(line))
		if len(trimmed) == 0 {
			continue
		}

		var rows []map[string]any
		if err := json.Unmarshal(trimmed, &rows); err != nil {
			continue
		}
		if len(rows) == 0 {
			continue
		}

		cols, err := orderedKeys(trimmed)
		if err != nil {
			continue
		}

		lastRows = rows
		lastCols = cols
	}

	if lastRows == nil {
		return nil, nil, nil
	}
	if lastCols == nil {
		lastCols = []string{}
	}

	return lastRows, lastCols, nil
}

// getOrCreateSession lấy session hiện có hoặc tạo mới nếu chưa có.
func getOrCreateSession(sessionID string) (*duckdbSession, error) {
	if v, ok := sessionStore.Load(sessionID); ok {
		return v.(*duckdbSession), nil
	}

	// Đảm bảo duckdb CLI embedded có sẵn
	if _, err := getEmbeddedDuckDBCLI(); err != nil {
		// Lỗi CPU không hỗ trợ binary đã có sẵn thông điệp rõ ràng → trả nguyên văn.
		var cpuErr *cpuUnsupportedError
		if errors.As(err, &cpuErr) {
			return nil, err
		}
		return nil, fmt.Errorf("DuckDB CLI embedded không có sẵn: %w", err)
	}

	// Tạo file .duckdb duy nhất cho session (trong temp dir)
	dbFile := filepath.Join(os.TempDir(), fmt.Sprintf("duckdb_session_%s.duckdb", sessionID))

	sess := &duckdbSession{dbFile: dbFile}
	sessionStore.Store(sessionID, sess)
	tm_common.LogInfo(fmt.Sprintf("Tạo DuckDB session: %s -> %s", sessionID, dbFile))
	return sess, nil
}

// GetOrCreateSession tạo hoặc lấy session DuckDB theo session_id.
func GetOrCreateSession(sessionID string) (*duckdbSession, error) {
	return getOrCreateSession(sessionID)
}

// ExecuteQuery thực thi SQL script trên session DuckDB và trả về kết quả.
// Nhiều statement được gộp thành 1 chuỗi SQL, spawn 1 process duy nhất.
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

	statements := splitStatements(sqlQuery)
	result := &model.TMMultiQueryResult{
		Results: make([]*model.TMQueryResult, 0, len(statements)),
	}

	// Gộp tất cả statements thành 1 chuỗi SQL để spawn 1 process duy nhất
	var combined strings.Builder
	for i, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}
		if i > 0 {
			combined.WriteString("; ")
		}
		combined.WriteString(applyLimit(stmt, defaultLimit, unlimited))
	}
	combinedSQL := combined.String()

	stdout, _, err := runDuckDB(sess.dbFile, combinedSQL)
	if err != nil {
		return result, err
	}

	// Parse output: tách các mảng JSON (DuckDB CLI pretty-print có thể xuống dòng)
	jsonArrays := extractJSONArrays(stdout)
	arrIdx := 0

	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}

		selectStmt := isSelect(stmt)

		if selectStmt {
			// Tìm mảng JSON tiếp theo có dữ liệu
			var rows []map[string]any
			var cols []string
			for arrIdx < len(jsonArrays) {
				r, c, err2 := parseJSONRows(jsonArrays[arrIdx])
				arrIdx++
				if err2 == nil {
					rows = r
					cols = c
					break
				}
			}
			if rows == nil {
				rows = []map[string]any{}
			}
			if cols == nil {
				cols = []string{}
			}

			result.Results = append(result.Results, &model.TMQueryResult{
				Columns:  cols,
				Rows:     rows,
				IsSelect: true,
			})
		} else {
			result.Results = append(result.Results, &model.TMQueryResult{
				Columns:      []string{},
				Rows:         []map[string]any{},
				IsSelect:     false,
				RowsAffected: 0,
			})
		}
	}

	return result, nil
}

// parseJSONRows parse 1 mảng JSON thành []map[string]any, đồng thời lấy danh sách cột
// theo ĐÚNG thứ tự xuất hiện trong JSON (không dùng range trên map).
func parseJSONRows(stdout []byte) ([]map[string]any, []string, error) {
	trimmed := bytes.TrimSpace(stdout)
	if len(trimmed) == 0 {
		return nil, nil, nil
	}

	var rows []map[string]any
	if err := json.Unmarshal(trimmed, &rows); err != nil {
		return nil, nil, fmt.Errorf("parse JSON kết quả thất bại: %w", err)
	}

	if len(rows) == 0 {
		return nil, nil, nil
	}

	// Lấy tên cột theo thứ tự key của dòng đầu tiên
	cols, err := orderedKeys(trimmed)
	if err != nil {
		return nil, nil, fmt.Errorf("đọc thứ tự cột thất bại: %w", err)
	}

	return rows, cols, nil
}

// LoadFile nạp file vào session DuckDB dưới dạng view.
// Tất cả câu lệnh liên quan (LOAD ext, CREATE VIEW, DESCRIBE, COUNT) được gộp
// thành 1 chuỗi SQL để spawn 1 process duy nhất.
func LoadFile(sessionID, filePath, tableName, fileID, fileName string) ([]fileLoadResult, error) {
	sess, err := getOrCreateSession(sessionID)
	if err != nil {
		return nil, err
	}

	sess.mu.Lock()
	defer sess.mu.Unlock()

	ext := strings.ToLower(filepath.Ext(filePath))

	var results []fileLoadResult

	// Lấy danh sách view đã có trong session để tránh trùng tên
	existingViews := getExistingViews(sess)

	switch ext {
	case ".xlsx", ".ods":
		// Đọc bằng extension rusty_sheet (streaming trong DuckDB), convert mỗi sheet
		// sang parquet tạm. KHÔNG dùng thư viện Go: go-ods/excelize nạp cả bảng tính
		// vào RAM (ODS 1 triệu dòng ≈ 8 GB) và nổ tung với dòng sentinel của
		// LibreOffice (number-rows-repeated=1048576) — xem dl_duckdb_spreadsheet.go.
		sheets, err := convertSpreadsheetToStagedSheets(sess.dbFile, filePath)
		if err != nil {
			return nil, err
		}
		_ = os.Remove(filePath) // đã convert xong, file gốc không còn dùng
		results, err = loadSheetsAsViews(sess, sheets, tableName, existingViews)
		if err != nil {
			return nil, err
		}

	case ".xls":
		// Convert .xls (BIFF8) sang .xlsx tạm để đọc qua rusty_sheet + chia lô parquet,
		// tránh xlrd-go nạp toàn bộ sheet lên RAM và tránh calamine báo "empty" với BIFF8.
		xlsxTmp := strings.TrimSuffix(filePath, filepath.Ext(filePath)) + "_converted.xlsx"
		if err := convertXlsToXlsx(filePath, xlsxTmp); err != nil {
			return nil, err
		}
		_ = os.Remove(filePath)
		sheets, err := convertSpreadsheetToStagedSheets(sess.dbFile, xlsxTmp)
		_ = os.Remove(xlsxTmp) // xlsx tạm đã đọc xong sang parquet, không cần giữ
		if err != nil {
			return nil, err
		}
		results, err = loadSheetsAsViews(sess, sheets, tableName, existingViews)
		if err != nil {
			return nil, err
		}

	case ".csv", ".tsv":
		uniqueName := getUniqueTableName(tableName, existingViews)
		existingViews[uniqueName] = true
		readExpr := fmt.Sprintf("read_csv_auto('%s')", escapeSingleQuote(filePath))
		result, err2 := loadSingleView(sess, uniqueName, readExpr, "")
		if err2 != nil {
			return nil, err2
		}
		results = append(results, result)

	case ".parquet":
		uniqueName := getUniqueTableName(tableName, existingViews)
		existingViews[uniqueName] = true
		readExpr := fmt.Sprintf("read_parquet('%s')", escapeSingleQuote(filePath))
		result, err2 := loadSingleView(sess, uniqueName, readExpr, "")
		if err2 != nil {
			return nil, err2
		}
		results = append(results, result)

	case ".json":
		uniqueName := getUniqueTableName(tableName, existingViews)
		existingViews[uniqueName] = true
		readExpr := fmt.Sprintf("read_json_auto('%s')", escapeSingleQuote(filePath))
		result, err2 := loadSingleView(sess, uniqueName, readExpr, "")
		if err2 != nil {
			return nil, err2
		}
		results = append(results, result)

	case ".ndjson", ".jsonl":
		uniqueName := getUniqueTableName(tableName, existingViews)
		existingViews[uniqueName] = true
		readExpr := fmt.Sprintf("read_ndjson_auto('%s')", escapeSingleQuote(filePath))
		result, err2 := loadSingleView(sess, uniqueName, readExpr, "")
		if err2 != nil {
			return nil, err2
		}
		results = append(results, result)

	default:
		return nil, fmt.Errorf("định dạng file không hỗ trợ: %s", ext)
	}

	for _, r := range results {
		// Với xlsx/xls/ods, view đọc dữ liệu tạm của từng sheet (parquet hoặc CSV)
		fp := filePath
		if r.TempPath != "" {
			fp = r.TempPath
		}
		sess.files = append(sess.files, loadedFile{
			FileID:    fileID,
			FileName:  fileName,
			TableName: r.TableName,
			FilePath:  fp,
			RowCount:  r.RowCount,
			Columns:   r.Columns,
		})
	}

	return results, nil
}

// loadSingleView tạo 1 view duy nhất từ readExpr, trả về thông tin cột/số dòng.
// preSQL (nếu có, vd: LOAD extension) sẽ được gộp vào cùng CREATE VIEW vì
// extension không persist qua các process CLI khác nhau.
// Tất cả (DROP VIEW + preSQL + CREATE VIEW + DESCRIBE + COUNT) được gộp thành
// 1 chuỗi SQL để spawn 1 process duy nhất.
func loadSingleView(sess *duckdbSession, tableName, readExpr, preSQL string) (fileLoadResult, error) {
	// Xoá view cũ nếu tồn tại
	dropSQL := fmt.Sprintf("DROP VIEW IF EXISTS \"%s\"", escapeDQ(tableName))

	// Tạo view mới, gộp preSQL (vd: LOAD extension) vào cùng 1 lệnh
	createSQL := fmt.Sprintf("CREATE VIEW \"%s\" AS SELECT * FROM %s", escapeDQ(tableName), readExpr)
	if preSQL != "" {
		createSQL = preSQL + "; " + createSQL
	}

	// Lấy danh sách cột qua DESCRIBE
	descSQL := fmt.Sprintf("DESCRIBE \"%s\"", escapeDQ(tableName))
	if preSQL != "" {
		descSQL = preSQL + "; " + descSQL
	}

	// Đếm số dòng
	countSQL := fmt.Sprintf("SELECT COUNT(*) AS cnt FROM \"%s\"", escapeDQ(tableName))
	if preSQL != "" {
		countSQL = preSQL + "; " + countSQL
	}

	// Gộp tất cả thành 1 chuỗi SQL, spawn 1 process duy nhất
	combinedSQL := dropSQL + "; " + createSQL + "; " + descSQL + "; " + countSQL
	stdout, _, err := runDuckDB(sess.dbFile, combinedSQL)
	if err != nil {
		// Lỗi CPU không hỗ trợ binary: trả nguyên văn, không bọc thêm
		// "tạo view ... thất bại" để thông điệp dễ đọc.
		var cpuErr *cpuUnsupportedError
		if errors.As(err, &cpuErr) {
			return fileLoadResult{}, err
		}
		return fileLoadResult{}, fmt.Errorf("tạo view '%s' thất bại: %w", tableName, err)
	}

	// Parse output: tách các mảng JSON (DuckDB CLI pretty-print có thể xuống dòng)
	jsonArrays := extractJSONArrays(stdout)
	var columns []string
	var rowCount int64

	for _, arr := range jsonArrays {
		rows, _, err2 := parseJSONRows(arr)
		if err2 != nil || len(rows) == 0 {
			continue
		}

		// Nếu dòng có column_name → là kết quả DESCRIBE
		if _, ok := rows[0]["column_name"]; ok {
			columns = make([]string, 0, len(rows))
			for _, row := range rows {
				if colName, ok := row["column_name"]; ok {
					columns = append(columns, fmt.Sprintf("%v", colName))
				}
			}
		}
		// Nếu dòng có cnt → là kết quả COUNT
		if cnt, ok := rows[0]["cnt"]; ok {
			switch v := cnt.(type) {
			case float64:
				rowCount = int64(v)
			case string:
				fmt.Sscanf(v, "%d", &rowCount)
			}
		}
	}

	if len(columns) == 0 {
		cols2, err3 := getColumnsFromSelect(sess, tableName, preSQL)
		if err3 != nil {
			return fileLoadResult{}, err3
		}
		columns = cols2
	}

	return fileLoadResult{
		TableName: tableName,
		Columns:   columns,
		RowCount:  rowCount,
	}, nil
}

// csvReadExpr trả về biểu thức đọc CSV tạm do mình tự sinh (dòng đầu luôn là header).
func csvReadExpr(csvPath string) string {
	return fmt.Sprintf("read_csv_auto('%s')", escapeSingleQuote(csvPath))
}

// loadSheetsAsViews tạo 1 view cho mỗi sheet (dùng chung cho xlsx/xls/ods).
// Tên view: <tên_file>_<tên_sheet>, đã chuẩn hoá + đảm bảo không trùng.
func loadSheetsAsViews(sess *duckdbSession, sheets []stagedSheet, baseTableName string, existingViews map[string]bool) ([]fileLoadResult, error) {
	results := make([]fileLoadResult, 0, len(sheets))
	for i, sh := range sheets {
		safeSheet := SanitizeIdentifier(sh.SheetName)
		if safeSheet == "" {
			safeSheet = fmt.Sprintf("sheet%d", i+1)
		}
		viewName := safeSheet
		if baseTableName != "" {
			viewName = baseTableName + "_" + safeSheet
		}
		uniqueName := getUniqueTableName(viewName, existingViews)
		existingViews[uniqueName] = true

		result, err := loadSingleView(sess, uniqueName, sh.ReadExpr, "")
		if err != nil {
			// rollback: xoá các view đã tạo của file này + toàn bộ dữ liệu tạm
			rollback := make([]loadedFile, 0, len(results))
			for _, r := range results {
				rollback = append(rollback, loadedFile{TableName: r.TableName})
			}
			dropViewsAndTempFiles(sess, rollback)
			removeStagedSheets(sheets)
			return nil, err
		}
		result.TempPath = sh.TempPath
		results = append(results, result)
	}
	return results, nil
}

// invalidIdentChars: mọi ký tự KHÔNG phải chữ (kể cả chữ có dấu), dấu kết hợp, số, "_".
// \p{M} bắt buộc phải có: tiếng Việt dạng NFD (macOS, một số trình duyệt) tách dấu thành
// ký tự kết hợp riêng (e + ̣ + ̂). Thiếu \p{M} thì "ệ" bị biến thành "e__".
var invalidIdentChars = regexp.MustCompile(`[^\p{L}\p{M}\p{N}_]+`)
var multiUnderscore = regexp.MustCompile(`_{2,}`)

// NormalizeNFC đưa chuỗi Unicode về dạng NFC (dấu tiếng Việt dựng sẵn) để cùng 1 tên
// luôn cho cùng 1 chuỗi byte, bất kể file được tạo trên Windows (NFC) hay macOS (NFD).
func NormalizeNFC(s string) string {
	return norm.NFC.String(s)
}

// SanitizeIdentifier chuyển tên file/sheet thành tên bảng/view hợp lệ cho DuckDB.
// Đây là HÀM DUY NHẤT sinh tên bảng — mọi nơi (upload handler, sheet, ...) đều phải gọi hàm này.
//
// Quy tắc:
//   - Chuẩn hoá NFC, chuyển chữ thường.
//   - Giữ chữ Unicode (tiếng Việt có dấu), số và "_"; ký tự khác → "_".
//   - Gộp nhiều "_" liên tiếp thành 1, bỏ "_" ở đầu/cuối.
//   - Nếu bắt đầu bằng số → thêm "t" vào đầu (vd: "2024_luong" → "t2024_luong").
//   - Trả về "" nếu không còn ký tự nào (caller tự chọn tên mặc định).
func SanitizeIdentifier(name string) string {
	s := norm.NFC.String(strings.TrimSpace(name))
	s = invalidIdentChars.ReplaceAllString(s, "_")
	s = multiUnderscore.ReplaceAllString(s, "_")
	s = strings.Trim(s, "_")
	s = strings.ToLower(s)
	if s == "" {
		return ""
	}
	if r, _ := utf8.DecodeRuneInString(s); unicode.IsNumber(r) {
		s = "t" + s
	}
	return s
}

// getExistingViews trả về set các view name đã tồn tại trong session.
func getExistingViews(sess *duckdbSession) map[string]bool {
	views := make(map[string]bool)
	for _, f := range sess.files {
		views[f.TableName] = true
	}
	return views
}

// getUniqueTableName sinh tên table unique dựa trên baseName, tránh trùng với existingViews.
// Nếu baseName đã tồn tại, thử baseName_1, baseName_2, ...
func getUniqueTableName(baseName string, existingViews map[string]bool) string {
	// Sanitize baseName trước
	safeName := SanitizeIdentifier(baseName)
	if safeName == "" {
		safeName = "data"
	}

	if !existingViews[safeName] {
		return safeName
	}

	for i := 1; ; i++ {
		candidate := fmt.Sprintf("%s_%d", safeName, i)
		if !existingViews[candidate] {
			return candidate
		}
	}
}

// getColumnsFromSelect lấy tên cột của view bằng DESCRIBE (có thứ tự chuẩn, và hoạt động
// cả khi bảng rỗng — khác với SELECT ... LIMIT 0 vốn trả về 0 dòng nên không có key nào).
// preSQL (nếu có) sẽ được gộp vào câu lệnh.
func getColumnsFromSelect(sess *duckdbSession, tableName, preSQL string) ([]string, error) {
	descSQL := fmt.Sprintf("DESCRIBE \"%s\"", escapeDQ(tableName))
	if preSQL != "" {
		descSQL = preSQL + "; " + descSQL
	}

	stdout, _, err := runDuckDB(sess.dbFile, descSQL)
	if err != nil {
		return nil, fmt.Errorf("đọc cột thất bại: %w", err)
	}

	for _, arr := range extractJSONArrays(stdout) {
		rows, _, err2 := parseJSONRows(arr)
		if err2 != nil || len(rows) == 0 {
			continue
		}
		if _, ok := rows[0]["column_name"]; !ok {
			continue
		}

		// Mỗi dòng DESCRIBE là 1 cột, thứ tự dòng = thứ tự cột
		cols := make([]string, 0, len(rows))
		for _, row := range rows {
			if name, ok := row["column_name"]; ok {
				cols = append(cols, fmt.Sprintf("%v", name))
			}
		}
		return cols, nil
	}

	return []string{}, nil
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

	newFiles := make([]loadedFile, 0, len(sess.files))
	var dropped []loadedFile
	for _, f := range sess.files {
		if f.FileID == tableNameOrFileID || f.TableName == tableNameOrFileID {
			dropped = append(dropped, f)
		} else {
			newFiles = append(newFiles, f)
		}
	}
	dropViewsAndTempFiles(sess, dropped)
	sess.files = newFiles
	return nil
}

// dropViewsAndTempFiles DROP VIEW (1 process duy nhất) rồi xoá dữ liệu tạm mà các view đã đọc.
// Dùng os.RemoveAll vì dữ liệu tạm của .xlsx/.ods là cả thư mục parquet.
// Phải gọi khi đang giữ sess.mu.
func dropViewsAndTempFiles(sess *duckdbSession, files []loadedFile) {
	if len(files) == 0 {
		return
	}
	var sqlB strings.Builder
	for _, f := range files {
		sqlB.WriteString(fmt.Sprintf("DROP VIEW IF EXISTS \"%s\"; ", escapeDQ(f.TableName)))
	}
	_, _, _ = runDuckDB(sess.dbFile, sqlB.String())
	for _, f := range files {
		if f.FilePath != "" {
			_ = os.RemoveAll(f.FilePath)
		}
	}
}

// DropAllFiles xoá toàn bộ view + file tạm trong session (giữ lại session).
func DropAllFiles(sessionID string) {
	v, ok := sessionStore.Load(sessionID)
	if !ok {
		return
	}
	sess := v.(*duckdbSession)
	sess.mu.Lock()
	defer sess.mu.Unlock()
	dropViewsAndTempFiles(sess, sess.files)
	sess.files = nil
}

// DropSession xoá session khỏi memory và xóa file .duckdb.
func DropSession(sessionID string) {
	v, ok := sessionStore.LoadAndDelete(sessionID)
	if !ok {
		return
	}
	sess := v.(*duckdbSession)
	sess.mu.Lock()
	defer sess.mu.Unlock()
	for _, f := range sess.files {
		if f.FilePath != "" {
			_ = os.RemoveAll(f.FilePath)
		}
	}
	sess.files = nil
	if sess.dbFile != "" {
		_ = os.Remove(sess.dbFile)
		_ = os.Remove(sess.dbFile + ".wal")
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

// escapeSingleQuote escape dấu ' trong giá trị chuỗi.
func escapeSingleQuote(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}

// extractJSONArrays tách stdout thành các mảng JSON hoàn chỉnh.
// DuckDB CLI pretty-print có thể xuống dòng bên trong mảng, nên không thể tách
// theo \n. Hàm này theo dõi độ sâu [ ] để tìm ranh giới của từng mảng JSON.
func extractJSONArrays(stdout []byte) [][]byte {
	var arrays [][]byte
	depth := 0
	start := -1
	for i, b := range stdout {
		if b == '[' {
			if depth == 0 {
				start = i
			}
			depth++
		} else if b == ']' {
			depth--
			if depth == 0 && start >= 0 {
				arrays = append(arrays, stdout[start:i+1])
				start = -1
			}
		}
	}
	return arrays
}

// EscapeDQ escape dấu " trong tên identifier (exported cho service layer dùng).
func EscapeDQ(s string) string {
	return strings.ReplaceAll(s, "\"", "\"\"")
}

// RunDuckDB spawn 1 tiến trình DuckDB CLI, trả về stdout/stderr/error.
// Dùng cho service layer cần chạy SQL tùy ý (vd: DROP VIEW).
func RunDuckDB(dbFile, sql string) ([]byte, []byte, error) {
	return runDuckDB(dbFile, sql)
}

// ClearSessionFiles xoá danh sách file trong session (không xoá file .duckdb).
func ClearSessionFiles(sessionID string) {
	v, ok := sessionStore.Load(sessionID)
	if !ok {
		return
	}
	sess := v.(*duckdbSession)
	sess.mu.Lock()
	defer sess.mu.Unlock()
	sess.files = nil
}

// escapeDQ escape dấu " trong tên identifier (internal).
func escapeDQ(s string) string {
	return strings.ReplaceAll(s, "\"", "\"\"")
}

// convertXlsToXlsx chuyển file .xls (BIFF8) sang file .xlsx tạm bằng Go thuần:
// xlrd-go đọc, ghi ZIP+XML thủ công — không dùng excelize (quá nặng, phụ thuộc
// rất nhiều thư viện C/go-ods). Sau khi convert xong, file .xlsx được đọc qua
// rusty_sheet + chia lô parquet (xem dl_duckdb_spreadsheet.go) nên không load
// toàn bộ bảng tính lên RAM.
//
// Lưu ý: XLS chỉ tối đa 65,536 dòng/sheet, nên file convert ra có kích thước
// đáng nhận, việc ghi sheet vào buffer khi convert là chấp nhận được.
func convertXlsToXlsx(xlsPath, xlsxPath string) error {
	book, err := xlrd.OpenWorkbook(xlsPath, nil)
	if err != nil {
		return fmt.Errorf("mở file .xls thất bại: %w", err)
	}

	sheetNames := book.SheetNames()
	if len(sheetNames) == 0 {
		return fmt.Errorf("file .xls không có sheet nào")
	}

	out, err := os.Create(xlsxPath)
	if err != nil {
		return fmt.Errorf("tạo file .xlsx tạm thất bại: %w", err)
	}
	defer out.Close()

	zw := zip.NewWriter(out)

	entries := []struct {
		name string
		data string
	}{
		{"[Content_Types].xml", xlsxContentTypes(len(sheetNames))},
		{"_rels/.rels", xlsxRels()},
		{"docProps/core.xml", xlsxCoreProps()},
		{"xl/_rels/workbook.xml.rels", xlsxWorkbookRels(len(sheetNames))},
		{"xl/workbook.xml", xlsxWorkbook(sheetNames)},
		{"xl/styles.xml", xlsxStyles()},
		{"xl/theme/theme1.xml", xlsxTheme()},
	}
	for _, e := range entries {
		if err := writeZipEntry(zw, e.name, e.data); err != nil {
			zw.Close()
			return err
		}
	}

	for i := range sheetNames {
		sh, err := book.SheetByIndex(i)
		if err != nil {
			zw.Close()
			return fmt.Errorf("đọc sheet %d thất bại: %w", i, err)
		}
		if sh.NRows == 0 || sh.NCols == 0 {
			continue
		}

		w, err := zw.Create(fmt.Sprintf("xl/worksheets/sheet%d.xml", i+1))
		if err != nil {
			zw.Close()
			return err
		}
		bw := bufio.NewWriter(w)
		bw.WriteString(xlsxWorksheetHeader())
		for r := 0; r < sh.NRows; r++ {
			bw.WriteString(`<row r="`)
			bw.WriteString(strconv.Itoa(r + 1))
			bw.WriteString(`">`)
			for c := 0; c < sh.NCols; c++ {
				bw.WriteString(`<c r="`)
				bw.WriteString(spreadsheetColumnLetter(c + 1) + strconv.Itoa(r+1))
				bw.WriteString(`" t="str"><v>`)
				bw.WriteString(xlsxEscape(fmt.Sprintf("%v", sh.CellValue(r, c))))
				bw.WriteString(`</v></c>`)
			}
			bw.WriteString(`</row>`)
		}
		bw.WriteString(`</sheetData></worksheet>`)
		if err := bw.Flush(); err != nil {
			zw.Close()
			return err
		}
	}

	if err := zw.Close(); err != nil {
		return err
	}
	return nil
}

func writeZipEntry(zw *zip.Writer, name, data string) error {
	w, err := zw.Create(name)
	if err != nil {
		return err
	}
	_, err = w.Write([]byte(data))
	return err
}

// ----- template XML cho file .xlsx tối giản (chỉ cần sheetData, không styles phức tạp) -----

func xlsxContentTypes(n int) string {
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="xml" ContentType="application/xml"/>
 <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
 <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`)
	for i := 0; i < n; i++ {
		b.WriteString(fmt.Sprintf(` <Override PartName="/xl/worksheets/sheet%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`, i+1))
	}
	b.WriteString(`</Types>`)
	return b.String()
}

func xlsxRels() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
}

func xlsxCoreProps() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>
`
}

func xlsxWorkbookRels(n int) string {
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`)
	for i := 0; i < n; i++ {
		b.WriteString(fmt.Sprintf(`<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/>`, i+1, i+1))
	}
	b.WriteString(`</Relationships>`)
	return b.String()
}

func xlsxWorkbook(sheetNames []string) string {
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
 <sheets>`)
	for i, name := range sheetNames {
		b.WriteString(fmt.Sprintf(`<sheet name="%s" sheetId="%d" r:id="rId%d"/>`, xlsxEscape(name), i+1, i+1))
	}
	b.WriteString(`</sheets></workbook>`)
	return b.String()
}

func xlsxStyles() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts><fills><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`
}

func xlsxTheme() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" name="Office Theme"><a:slideSize sx="10202400" sy="6801600" hasHeader="false" notesSz="685800" orientation="notSlide"/><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="808080"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Cambria" panose="02020603050405020204" pitchFamily="34" charset="0"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri" panose="020F0502020204030204" pitchFamily="34" charset="0"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme>...</a:fmtScheme></a:theme>`
}

func xlsxWorksheetHeader() string {
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>`
}

func xlsxEscape(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	return s
}

// orderedKeys trả về tên các key của object ĐẦU TIÊN trong mảng JSON,
// theo đúng thứ tự xuất hiện trong chuỗi JSON (= thứ tự cột của câu SELECT).
// Không thể dùng map[string]any vì Go map không giữ thứ tự khi range.
// Key trùng (vd: SELECT a.id, b.id) chỉ được giữ 1 lần.
func orderedKeys(raw []byte) ([]string, error) {
	dec := json.NewDecoder(bytes.NewReader(raw))

	// Token '[' mở đầu mảng
	if _, err := dec.Token(); err != nil {
		return nil, err
	}

	// Token '{' mở đầu object đầu tiên
	tok, err := dec.Token()
	if err != nil {
		return nil, err
	}
	if d, ok := tok.(json.Delim); !ok || d != '{' {
		return nil, fmt.Errorf("phần tử đầu tiên của mảng không phải object")
	}

	keys := make([]string, 0, 16)
	seen := make(map[string]bool)

	for dec.More() {
		keyTok, err := dec.Token()
		if err != nil {
			return nil, err
		}
		key, ok := keyTok.(string)
		if !ok {
			return nil, fmt.Errorf("key của object không phải string")
		}

		// Bỏ qua value (kể cả object/array lồng nhau) để con trỏ nhảy tới key kế tiếp
		var skip json.RawMessage
		if err := dec.Decode(&skip); err != nil {
			return nil, err
		}

		if !seen[key] {
			seen[key] = true
			keys = append(keys, key)
		}
	}
	return keys, nil
}
