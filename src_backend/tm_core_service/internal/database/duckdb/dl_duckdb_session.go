// Package duckdb cung cấp tầng data access cho DuckDB qua CLI.
//
// Mỗi session là 1 file .duckdb persistent (temp). Mỗi thao tác (query, upload, drop)
// spawn 1 tiến trình DuckDB CLI với -json -c "<SQL>" — các câu lệnh liên quan được
// gộp thành 1 chuỗi SQL để giảm số lần spawn process.
// Không dùng CGO/libduckdb → build cross-platform được.
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
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"sync"

	ods "github.com/mukbeast4/go-ods"
	"github.com/yamitzky/xlrd-go/xlrd"
	"tm_core_service/internal/model"
	"tm_core_service/tm_common"
)

// DefaultQueryLimit là giới hạn số dòng khi frontend không gửi default_limit.
const DefaultQueryLimit = 1000

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

		embeddedCLICache = outPath
		tm_common.LogInfo(fmt.Sprintf("Đã giải nén DuckDB CLI embedded: %s", outPath))
	})
	return embeddedCLICache, embeddedCLIErr
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
	dbFile   string
	mu       sync.Mutex
	files    []loadedFile
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
}

// csvSheet lưu thông tin 1 sheet đã convert từ .ods sang CSV tạm.
type csvSheet struct {
	SheetName string
	CsvPath   string
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

		lastRows = rows
		lastCols = make([]string, 0, len(rows[0]))
		for k := range rows[0] {
			lastCols = append(lastCols, k)
		}
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
				Columns: cols,
				Rows:    rows,
				IsSelect: true,
			})
		} else {
			result.Results = append(result.Results, &model.TMQueryResult{
				Columns:   []string{},
				Rows:      []map[string]any{},
				IsSelect:  false,
				RowsAffected: 0,
			})
		}
	}

	return result, nil
}

// parseJSONRows parse 1 dòng JSON array thành []map[string]any, đồng thời lấy danh sách cột.
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

	// Lấy tên cột từ dòng đầu tiên
	cols := make([]string, 0, len(rows[0]))
	for k := range rows[0] {
		cols = append(cols, k)
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
	case ".xlsx":
		// Cần extension excel của DuckDB (chỉ hỗ trợ .xlsx OpenXML)
		// INSTALL excel tải về DuckDB home cache (chỉ cần 1 lần).
		if _, _, err2 := runDuckDB(sess.dbFile, "INSTALL excel;"); err2 != nil {
			tm_common.LogInfo(fmt.Sprintf("DuckDB INSTALL excel info: %v", err2))
		}
		uniqueName := getUniqueTableName(tableName, existingViews)
		existingViews[uniqueName] = true
		// all_varchar=true: đọc tất cả cột kiểu VARCHAR để tránh lỗi infer type
		// (ví dụ: cột số điện thoại bị đọc thành DOUBLE mà gặp chuỗi sẽ lỗi)
		readExpr := fmt.Sprintf("read_xlsx('%s', all_varchar=true)", escapeSingleQuote(filePath))
		result, err2 := loadSingleView(sess, uniqueName, readExpr, "LOAD excel")
		if err2 != nil {
			return nil, err2
		}
		results = append(results, result)

	case ".ods":
		// Convert .ods sang CSV bằng thư viện Go (không cần extension binary),
		// sau đó load từng sheet qua read_csv_auto. Hoạt động trên tất cả platform.
		csvSheets, err := convertOdsToCsvSheets(filePath)
		if err != nil {
			return nil, err
		}
		for _, cs := range csvSheets {
			uniqueName := getUniqueTableName(cs.SheetName, existingViews)
			existingViews[uniqueName] = true
			readExpr := fmt.Sprintf("read_csv_auto('%s')", escapeSingleQuote(cs.CsvPath))
			result, err2 := loadSingleView(sess, uniqueName, readExpr, "")
			if err2 != nil {
				for _, s := range csvSheets {
					os.Remove(s.CsvPath)
				}
				return nil, err2
			}
			results = append(results, result)
		}

	case ".xls":
		results, err = loadXlsSheetsWithUniqueNames(sess, filePath, tableName, existingViews)
		if err != nil {
			return nil, err
		}
		for _, r := range results {
			existingViews[r.TableName] = true
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
		sess.files = append(sess.files, loadedFile{
			FileID:    fileID,
			FileName:  fileName,
			TableName: r.TableName,
			FilePath:  filePath,
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

// convertOdsToCsvSheets đọc file .ods, convert mỗi sheet thành file CSV tạm,
// trả về danh sách sheet đã convert.
func convertOdsToCsvSheets(odsPath string) ([]csvSheet, error) {
	f, err := ods.OpenFile(odsPath)
	if err != nil {
		return nil, fmt.Errorf("mở file .ods thất bại: %w", err)
	}
	defer f.Close()

	sheetNames := f.GetSheetList()
	if len(sheetNames) == 0 {
		return nil, fmt.Errorf("file .ods không có sheet nào")
	}

	var sheets []csvSheet
	for _, sheetName := range sheetNames {
		rows, err := f.GetRows(sheetName)
		if err != nil {
			return nil, fmt.Errorf("đọc sheet '%s' thất bại: %w", sheetName, err)
		}

		safeSheet := sanitizeSheetName(sheetName)
		csvPath := strings.TrimSuffix(odsPath, filepath.Ext(odsPath)) + "_" + safeSheet + ".csv"
		csvFile, err := os.Create(csvPath)
		if err != nil {
			return nil, fmt.Errorf("tạo file CSV tạm thất bại: %w", err)
		}

		writer := csv.NewWriter(csvFile)
		for _, row := range rows {
			if err := writer.Write(row); err != nil {
				csvFile.Close()
				return nil, fmt.Errorf("ghi CSV thất bại: %w", err)
			}
		}
		writer.Flush()
		if err := writer.Error(); err != nil {
			csvFile.Close()
			return nil, fmt.Errorf("flush CSV thất bại: %w", err)
		}
		csvFile.Close()

		sheets = append(sheets, csvSheet{
			SheetName: sheetName,
			CsvPath:   csvPath,
		})
	}

	return sheets, nil
}

// loadXlsSheets đọc tất cả sheet của file .xls, mỗi sheet tạo 1 view.
func loadXlsSheets(sess *duckdbSession, xlsPath, baseTableName string) ([]fileLoadResult, error) {
	book, err := xlrd.OpenWorkbook(xlsPath, nil)
	if err != nil {
		return nil, fmt.Errorf("mở file .xls thất bại: %w", err)
	}

	sheetNames := book.SheetNames()
	if len(sheetNames) == 0 {
		return nil, fmt.Errorf("file .xls không có sheet nào")
	}

	var results []fileLoadResult

	for i, sheetName := range sheetNames {
		safeSheet := sanitizeSheetName(sheetName)
		viewName := baseTableName
		if safeSheet != "" {
			viewName = baseTableName + "_" + safeSheet
		}

		csvPath, err2 := convertXlsSheetToCsv(xlsPath, i)
		if err2 != nil {
			return nil, fmt.Errorf("convert sheet '%s' sang CSV thất bại: %w", sheetName, err2)
		}

		readExpr := fmt.Sprintf("read_csv_auto('%s')", escapeSingleQuote(csvPath))
		result, err2 := loadSingleView(sess, viewName, readExpr, "")
		if err2 != nil {
			os.Remove(csvPath)
			return nil, err2
		}
		results = append(results, result)
	}

	return results, nil
}

// convertXlsSheetToCsv đọc 1 sheet của file .xls, ghi ra CSV tạm.
func convertXlsSheetToCsv(xlsPath string, sheetIndex int) (string, error) {
	book, err := xlrd.OpenWorkbook(xlsPath, nil)
	if err != nil {
		return "", fmt.Errorf("mở file .xls thất bại: %w", err)
	}

	sheet, err := book.SheetByIndex(sheetIndex)
	if err != nil {
		return "", fmt.Errorf("không thể đọc sheet index %d của .xls: %w", sheetIndex, err)
	}

	csvPath := strings.TrimSuffix(xlsPath, filepath.Ext(xlsPath)) + fmt.Sprintf("_sheet%d.csv", sheetIndex)
	csvFile, err := os.Create(csvPath)
	if err != nil {
		return "", fmt.Errorf("tạo file CSV tạm thất bại: %w", err)
	}
	defer csvFile.Close()

	writer := csv.NewWriter(csvFile)
	defer writer.Flush()

	for r := 0; r < sheet.NRows; r++ {
		row := make([]string, sheet.NCols)
		for c := 0; c < sheet.NCols; c++ {
			row[c] = fmt.Sprintf("%v", sheet.CellValue(r, c))
		}
		if err := writer.Write(row); err != nil {
			return "", fmt.Errorf("ghi CSV thất bại: %w", err)
		}
	}

	return csvPath, nil
}

// sanitizeSheetName chuyển tên sheet thành identifier hợp lệ.
func sanitizeSheetName(name string) string {
	reg := regexp.MustCompile(`[^a-zA-Z0-9_]`)
	result := reg.ReplaceAllString(name, "_")
	if len(result) > 0 && result[0] >= '0' && result[0] <= '9' {
		result = "_" + result
	}
	return strings.ToLower(result)
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
	safeName := sanitizeSheetName(baseName)
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

// loadXlsSheetsWithUniqueNames giống loadXlsSheets nhưng đảm bảo tên view unique.
func loadXlsSheetsWithUniqueNames(sess *duckdbSession, xlsPath, baseTableName string, existingViews map[string]bool) ([]fileLoadResult, error) {
	book, err := xlrd.OpenWorkbook(xlsPath, nil)
	if err != nil {
		return nil, fmt.Errorf("mở file .xls thất bại: %w", err)
	}

	sheetNames := book.SheetNames()
	if len(sheetNames) == 0 {
		return nil, fmt.Errorf("file .xls không có sheet nào")
	}

	var results []fileLoadResult

	for i, sheetName := range sheetNames {
		safeSheet := sanitizeSheetName(sheetName)
		viewName := baseTableName
		if safeSheet != "" {
			viewName = baseTableName + "_" + safeSheet
		}
		uniqueName := getUniqueTableName(viewName, existingViews)
		existingViews[uniqueName] = true

		csvPath, err2 := convertXlsSheetToCsv(xlsPath, i)
		if err2 != nil {
			return nil, fmt.Errorf("convert sheet '%s' sang CSV thất bại: %w", sheetName, err2)
		}

		readExpr := fmt.Sprintf("read_csv_auto('%s')", escapeSingleQuote(csvPath))
		result, err2 := loadSingleView(sess, uniqueName, readExpr, "")
		if err2 != nil {
			os.Remove(csvPath)
			return nil, err2
		}
		results = append(results, result)
	}

	return results, nil
}

// getColumnsFromSelect lấy tên cột bằng SELECT * LIMIT 0.
// preSQL (nếu có) sẽ được gộp vào câu SELECT.
// getColumnsFromSelect lấy tên cột bằng SELECT * LIMIT 0.
// preSQL (nếu có) sẽ được gộp vào câu SELECT.
func getColumnsFromSelect(sess *duckdbSession, tableName, preSQL string) ([]string, error) {
	selectSQL := fmt.Sprintf("SELECT * FROM \"%s\" LIMIT 0", escapeDQ(tableName))
	if preSQL != "" {
		selectSQL = preSQL + "; " + selectSQL
	}
	stdout, _, err := runDuckDB(sess.dbFile, selectSQL)
	if err != nil {
		return nil, fmt.Errorf("đọc cột thất bại: %w", err)
	}
	_, cols, err2 := parseJSONRows(stdout)
	if err2 != nil {
		return nil, err2
	}
	return cols, nil
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

	newFiles := sess.files[:0]
	var dropped []string
	for _, f := range sess.files {
		if f.FileID == tableNameOrFileID || f.TableName == tableNameOrFileID {
			dropped = append(dropped, f.TableName)
		} else {
			newFiles = append(newFiles, f)
		}
	}
	for _, tableName := range dropped {
		_, _, _ = runDuckDB(sess.dbFile, fmt.Sprintf("DROP VIEW IF EXISTS \"%s\"", escapeDQ(tableName)))
	}
	sess.files = newFiles
	return nil
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
				arrays = append(arrays, stdout[start : i+1])
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
