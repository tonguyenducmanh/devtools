// Đọc file bảng tính (.xlsx, .ods) bằng extension DuckDB `rusty_sheet`.
//
// Vì sao KHÔNG dùng thư viện Go (go-ods / excelize)?
// --------------------------------------------------
// Các thư viện đó nạp TOÀN BỘ bảng tính vào bộ nhớ Go dưới dạng map/dense slice:
//
//   - go-ods (ODS): 1 file 1 triệu dòng x 10 cột ngốn ~8,4 GB RSS (đo thật).
//     Tệ hơn: dòng "sentinel" cuối sheet do LibreOffice/Excel ghi
//     (`table:number-rows-repeated="1048576"` + ô `<text:p/>`) bị thư viện coi là
//     dòng CÓ dữ liệu → nở ra 1.048.576 dòng x 1024 cột ⇒ ~250 GB ⇒ treo/tràn RAM
//     máy user (3 sheet x 1000 dòng là đủ chết). Đây chính là bug gốc.
//   - excelize (XLSX): 1 triệu dòng x 10 cột mất ~25 s, sinh thêm file CSV 128 MB
//     và mỗi lần query lại phải parse lại CSV.
//
// `rusty_sheet` đọc trực tiếp .xlsx/.xls/.ods trong DuckDB (Rust, đọc theo range) nên:
//
//   - File sentinel "bệnh" ở trên: 0,24 s / 43 MB, trả đúng 1000 dòng.
//   - 1 triệu dòng x 10 cột: ~5-6 s, ~400 MB (đo với chia lô 2 phần).
//
// Cách làm: convert MỖI SHEET sang parquet (DuckDB tự ghi, streaming), rồi tạo
// VIEW trên (các) file parquet đó. Nhờ vậy:
//
//   - Query sau không cần LOAD extension và không parse lại file gốc.
//   - Dung lượng đĩa nhỏ hơn CSV (~1/3) và đọc nhanh hơn nhiều.
//   - File parquet tạm bị xoá khi drop file/session như CSV trước đây.
//
// Chống OOM trên máy yếu (yếu tố quyết định): extension materialize cả range
// trong RAM (~115 byte/ô) nên đọc "một phát" sheet lớn sẽ ngốn GB. Vì vậy ta đọc
// THEO LÔ DÒNG ngay từ đầu: `range='A2:J888889'`, `'A888890:J1777778'`, … mỗi lô
// tối đa ~8 triệu ô (≈ 900 MB), rồi ghép các lô bằng MỘT view
// `read_parquet([...])`. Đo thật trên sheet 1 triệu dòng x 30 cột: 4 lô → 30 s /
// 688 MB, so với 1 lượt → 11 s / 2.066 MB. Máy yếu không chết, đổi lại chậm hơn;
// đó là lựa chọn có chủ ý.
//
// Nếu một lô vẫn hết bộ nhớ (sheet quá nhiều cột), ngân sách ô mỗi lô được giảm
// một nửa và đọc lại từ lô 1 — lùi dần cho tới khi vừa RAM.
//
// Extension được nhúng trong binary (`//go:embed all:extensions`) và ghi ra temp
// runtime. DuckDB suy ra tên hàm init từ TÊN FILE (`rusty_sheet_init_c_api`) nên
// file ghi ra phải tên đúng `rusty_sheet.duckdb_extension`; và phải LOAD bằng
// đường dẫn tuyệt đối (không cần SET extension_directory / đúng version-os_arch).
package duckdb

import (
	"embed"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"

	"tm_core_service/tm_common"
)

// embeddedExtensions nhúng toàn bộ thư mục extensions/ (file .duckdb_extension
// tải qua scripts/fetch/fetch_duckdb_extensions.sh).
//
// Dùng `all:` để .gitkeep (file ẩn) cũng được tính → build trên clone mới (chưa
// tải extension) vẫn thành công, lỗi chỉ hiện ra lúc dùng kèm hướng dẫn.
//
//go:embed all:extensions
var embeddedExtensions embed.FS

const (
	// spreadsheetBandCellBudget là số ô tối đa mỗi lô đọc (~8 triệu ô ≈ 900 MB
	// RAM với mức ~115 byte/ô của extension). Đây là "van an toàn" cho máy yếu:
	// sheet lớn hơn sẽ được đọc thành nhiều lô rồi ghép lại.
	spreadsheetBandCellBudget = 8_000_000
	// spreadsheetMinBandCells là sàn khi phải giảm ngân sách vì hết bộ nhớ
	// (lô nhỏ hơn nữa thì quá nhiều lô, chậm không chấp nhận được).
	spreadsheetMinBandCells = 250_000
	// spreadsheetMinBandRows tránh chia quá vụn với sheet rất nhiều cột.
	spreadsheetMinBandRows = 2_000
	// spreadsheetMaxBandRows tránh range vượt giới hạn dòng của Excel.
	spreadsheetMaxBandRows = 1_000_000
	// spreadsheetMaxBands chặn vòng lặp vô tận nếu file hỏng.
	spreadsheetMaxBands = 8192
)

var (
	spreadsheetExtPath string
	spreadsheetExtOnce sync.Once
	spreadsheetExtErr  error
)

// getSpreadsheetExtensionPath ghi extension rusty_sheet của platform hiện tại ra
// file temp (một lần) và trả về đường dẫn tuyệt đối.
func getSpreadsheetExtensionPath() (string, error) {
	spreadsheetExtOnce.Do(func() {
		platform := platformName()
		if platform == "" {
			spreadsheetExtErr = fmt.Errorf("nền tảng %s/%s chưa được hỗ trợ đọc file Excel/ODS", runtime.GOOS, runtime.GOARCH)
			return
		}

		asset := "extensions/rusty_sheet-" + platform + ".duckdb_extension"
		data, err := embeddedExtensions.ReadFile(asset)
		if err != nil || len(data) == 0 {
			spreadsheetExtErr = fmt.Errorf(
				"daemon chưa có extension đọc Excel/ODS cho %s. Chạy ./scripts/fetch/fetch_duckdb_extensions.sh rồi build lại daemon", platform)
			return
		}

		cacheDir := filepath.Join(os.TempDir(), "devtools-duckdb")
		if err := os.MkdirAll(cacheDir, 0755); err != nil {
			spreadsheetExtErr = fmt.Errorf("tạo thư mục extension thất bại: %w", err)
			return
		}

		// DuckDB lấy tên hàm init từ tên file → KHÔNG được đổi tên file này.
		outPath := filepath.Join(cacheDir, "rusty_sheet.duckdb_extension")
		if err := os.WriteFile(outPath, data, 0644); err != nil {
			spreadsheetExtErr = fmt.Errorf("ghi extension rusty_sheet thất bại: %w", err)
			return
		}

		spreadsheetExtPath = outPath
		tm_common.LogInfo(fmt.Sprintf("Đã giải nén extension rusty_sheet: %s", outPath))
	})
	return spreadsheetExtPath, spreadsheetExtErr
}

// spreadsheetLoadSQL trả về câu LOAD extension (không cần SET extension_directory).
func spreadsheetLoadSQL() (string, error) {
	extPath, err := getSpreadsheetExtensionPath()
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("LOAD '%s'", escapeSingleQuote(extPath)), nil
}

// runSpreadsheetDuckDB chạy SQL kèm LOAD extension rusty_sheet.
// Extension không persist giữa các process CLI nên phải LOAD ở mọi lần đọc file.
func runSpreadsheetDuckDB(dbFile, sql string) ([]byte, error) {
	loadSQL, err := spreadsheetLoadSQL()
	if err != nil {
		return nil, err
	}
	stdout, _, err := runDuckDB(dbFile, loadSQL+"; "+sql)
	if err != nil {
		return nil, err
	}
	return stdout, nil
}

// spreadsheetColumn là 1 cột của sheet: tên hiển thị + kiểu do extension suy ra.
type spreadsheetColumn struct {
	Name string
	Type string
}

// spreadsheetSheet là 1 sheet đã được phân tích (tên + danh sách cột).
type spreadsheetSheet struct {
	Name    string
	Columns []spreadsheetColumn
}

// analyzeSpreadsheet liệt kê sheet + cột + kiểu bằng analyze_sheets.
//
// Dùng analyze_sheets (không dùng header của read_sheet) vì nó chịu được header
// TRÙNG TÊN và header RỖNG: read_sheet(header=true) báo lỗi
// `duplicate column name "id"`, còn analyze_sheets trả về đủ cột theo vị trí.
func analyzeSpreadsheet(dbFile, srcPath string) ([]spreadsheetSheet, error) {
	sql := fmt.Sprintf(
		"SELECT sheet_name, column_name, column_type FROM analyze_sheets(['%s'], sheets=['*'])",
		escapeSingleQuote(srcPath))
	stdout, err := runSpreadsheetDuckDB(dbFile, sql)
	if err != nil {
		return nil, fmt.Errorf("không đọc được file bảng tính: %w", err)
	}

	var sheets []spreadsheetSheet
	indexByName := make(map[string]int)
	for _, arr := range extractJSONArrays(stdout) {
		rows, _, err2 := parseJSONRows(arr)
		if err2 != nil {
			continue
		}
		for _, row := range rows {
			sheetName := jsonScalar(row["sheet_name"])
			colName := jsonScalar(row["column_name"])
			colType := jsonScalar(row["column_type"])
			if sheetName == "" {
				continue
			}
			i, ok := indexByName[sheetName]
			if !ok {
				i = len(sheets)
				indexByName[sheetName] = i
				sheets = append(sheets, spreadsheetSheet{Name: sheetName})
			}
			sheets[i].Columns = append(sheets[i].Columns, spreadsheetColumn{Name: colName, Type: colType})
		}
	}

	if len(sheets) == 0 {
		return nil, fmt.Errorf("file bảng tính không có sheet nào có dữ liệu")
	}
	for i := range sheets {
		sheets[i].Columns = normalizeSpreadsheetColumns(sheets[i].Columns)
	}
	return sheets, nil
}

// jsonScalar chuyển giá trị JSON thành chuỗi (null → "").
func jsonScalar(v any) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return fmt.Sprint(v)
}

// normalizeSpreadsheetColumns làm tên cột hợp lệ và KHÔNG trùng:
//   - rỗng/toàn khoảng trắng → column1, column2, ... (theo vị trí)
//   - trùng (không phân biệt hoa/thường) → thêm hậu tố _2, _3, ...
//
// Không lower-case/không bỏ dấu: người dùng cần thấy đúng tên cột trong file.
func normalizeSpreadsheetColumns(cols []spreadsheetColumn) []spreadsheetColumn {
	out := make([]spreadsheetColumn, 0, len(cols))
	used := make(map[string]bool, len(cols))

	for i, col := range cols {
		name := strings.TrimSpace(strings.ReplaceAll(col.Name, "\x00", ""))
		if name == "" {
			name = fmt.Sprintf("column%d", i+1)
		}

		base := name
		for suffix := 2; ; suffix++ {
			if !used[strings.ToLower(name)] {
				break
			}
			name = fmt.Sprintf("%s_%d", base, suffix)
		}
		used[strings.ToLower(name)] = true
		out = append(out, spreadsheetColumn{Name: name, Type: col.Type})
	}
	return out
}

// spreadsheetSQLType ánh xạ kiểu do rusty_sheet trả về sang kiểu DuckDB.
//
// Dùng whitelist: giá trị này được chèn thẳng vào SQL nên không cho phép chuỗi
// tùy ý. Kiểu lạ → VARCHAR (an toàn, không mất dữ liệu).
func spreadsheetSQLType(t string) string {
	switch strings.ToLower(strings.TrimSpace(t)) {
	case "bigint", "int64", "long":
		return "BIGINT"
	case "hugeint", "uint64":
		return "HUGEINT"
	case "int", "integer", "int32":
		return "INTEGER"
	case "smallint", "int16":
		return "SMALLINT"
	case "tinyint", "int8", "byte":
		return "TINYINT"
	case "double", "float64":
		return "DOUBLE"
	case "real", "float", "float32":
		return "FLOAT"
	case "decimal", "numeric":
		return "DOUBLE"
	case "boolean", "bool":
		return "BOOLEAN"
	case "date":
		return "DATE"
	case "time":
		return "TIME"
	case "datetime", "timestamp", "timestamptz":
		return "TIMESTAMP"
	default:
		return "VARCHAR"
	}
}

// spreadsheetColumnLetter đổi chỉ số cột (1-based) sang chữ cái kiểu Excel: 1→A, 27→AA.
func spreadsheetColumnLetter(index int) string {
	if index < 1 {
		return "A"
	}
	buf := make([]byte, 0, 3)
	for index > 0 {
		index--
		buf = append(buf, byte('A'+index%26))
		index /= 26
	}
	for i, j := 0, len(buf)-1; i < j; i, j = i+1, j-1 {
		buf[i], buf[j] = buf[j], buf[i]
	}
	return string(buf)
}

// spreadsheetSelectList sinh danh sách SELECT theo VỊ TRÍ:
//
//	TRY_CAST("A" AS BIGINT) AS "mã đơn", ...
//
// Đọc bằng header=false nên cột nguồn luôn là A, B, C…; ta tự đặt tên + kiểu nên
// schema ổn định giữa các lô và không bị lỗi header trùng/rỗng.
func spreadsheetSelectList(cols []spreadsheetColumn) string {
	parts := make([]string, len(cols))
	for i, col := range cols {
		parts[i] = fmt.Sprintf(`TRY_CAST("%s" AS %s) AS "%s"`,
			spreadsheetColumnLetter(i+1), spreadsheetSQLType(col.Type), escapeDQ(col.Name))
	}
	return strings.Join(parts, ", ")
}

// spreadsheetReadSQL sinh lời gọi read_sheet.
//   - header=false: bỏ dòng tiêu đề (ta tự đặt tên cột).
//   - range: 'A2:J888889' (một lô có địa chỉ cuối tường minh nên calamine dừng
//     đúng chỗ — đây là điều giữ RAM có trần).
//   - columns={'*':'VARCHAR'}: nhận mọi ô dạng chuỗi rồi tự TRY_CAST, tránh
//     extension suy luận kiểu khác nhau giữa các lô.
//   - skip_empty_rows=true: BẮT BUỘC — nếu không, dòng sentinel cuối sheet của
//     LibreOffice (number-rows-repeated=1048576, ô <text:p/>) sẽ thành hàng trăm
//     nghìn dòng rỗng.
func spreadsheetReadSQL(srcPath, sheetName, rangeSpec string) string {
	return fmt.Sprintf(
		"read_sheet('%s', sheet='%s', header=false, range='%s', columns={'*':'VARCHAR'}, skip_empty_rows=true)",
		escapeSingleQuote(srcPath), escapeSingleQuote(sheetName), escapeSingleQuote(rangeSpec))
}

// convertSpreadsheetToStagedSheets convert mọi sheet của .xlsx/.ods sang parquet
// tạm và trả về danh sách sheet sẵn sàng tạo view.
func convertSpreadsheetToStagedSheets(dbFile, srcPath string) ([]stagedSheet, error) {
	sheets, err := analyzeSpreadsheet(dbFile, srcPath)
	if err != nil {
		return nil, err
	}

	staged := make([]stagedSheet, 0, len(sheets))
	for _, sheet := range sheets {
		if len(sheet.Columns) == 0 {
			continue
		}

		dir, err := os.MkdirTemp("", "duckdb_sheet_*")
		if err != nil {
			removeStagedSheets(staged)
			return nil, fmt.Errorf("tạo thư mục tạm cho sheet '%s' thất bại: %w", sheet.Name, err)
		}

		parts, err := writeSheetParquet(dbFile, srcPath, sheet, dir)
		if err != nil {
			_ = os.RemoveAll(dir)
			removeStagedSheets(staged)
			return nil, fmt.Errorf("đọc sheet '%s' thất bại: %w", sheet.Name, err)
		}
		if len(parts) == 0 {
			_ = os.RemoveAll(dir)
			continue
		}

		staged = append(staged, stagedSheet{
			SheetName: sheet.Name,
			ReadExpr:  parquetReadExpr(parts),
			TempPath:  dir,
		})
	}

	if len(staged) == 0 {
		return nil, fmt.Errorf("file bảng tính không có sheet nào có dữ liệu")
	}
	return staged, nil
}

// writeSheetParquet ghi 1 sheet ra 1 hoặc nhiều file parquet trong dir.
//
// Luôn đọc theo lô dòng (không đọc "một phát") để đỉnh RAM có trần: mỗi lô tối đa
// ~spreadsheetBandCellBudget ô (≈ 900 MB). Xem writeSheetBands để biết vì sao
// phải đọc thêm một lô rỗng ở cuối mỗi sheet.
//
// Nếu một lô vẫn hết bộ nhớ, ngân sách ô được giảm một nửa và đọc lại từ đầu —
// lùi dần cho tới khi vừa RAM (hoặc tới sàn spreadsheetMinBandCells).
func writeSheetParquet(dbFile, srcPath string, sheet spreadsheetSheet, dir string) ([]string, error) {
	budget := int64(spreadsheetBandCellBudget)
	var lastErr error

	for attempt := 0; attempt < 8; attempt++ {
		parts, err := writeSheetBands(dbFile, srcPath, sheet, dir, budget)
		if err == nil {
			return parts, nil
		}
		lastErr = err
		if !isLikelyOutOfMemory(err) {
			return nil, err
		}

		next := budget / 2
		if next*int64(len(sheet.Columns)) < spreadsheetMinBandCells {
			// Đã nhỏ nhất mà vẫn không đủ RAM: trả lỗi gốc kèm gợi ý.
			return nil, fmt.Errorf(
				"máy không đủ bộ nhớ để đọc sheet '%s' (%d cột). Hãy đóng bớt ứng dụng hoặc chia nhỏ file: %w",
				sheet.Name, len(sheet.Columns), lastErr)
		}
		tm_common.LogInfo(fmt.Sprintf(
			"Đọc sheet '%s' bị hết bộ nhớ ở mức %d ô/lô (%v) — giảm còn %d ô/lô",
			sheet.Name, budget, lastErr, next))
		budget = next

		// Dọn các part dở của lần thử trước.
		_ = os.RemoveAll(dir)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, err
		}
	}
	return nil, lastErr
}

// writeSheetBands đọc sheet thành các lô, mỗi lô tối đa `budget` ô.
//
// Dừng khi gặp lô rỗng. KHÔNG dừng khi lô "không đầy" (count < bandRows) vì
// `skip_empty_rows=true` bỏ cả dòng trống nằm GIỮA dữ liệu → lô không đầy không
// có nghĩa là đã hết dữ liệu; dừng sớm ở đó sẽ âm thầm mất dữ liệu. Giá phải trả
// là đúng MỘT lần đọc dư ở cuối mỗi sheet (calamine phải quét hết mới biết là
// rỗng) — chậm hơn một chút nhưng không bao giờ mất dòng.
func writeSheetBands(dbFile, srcPath string, sheet spreadsheetSheet, dir string, budget int64) ([]string, error) {
	bandRows := budget / int64(len(sheet.Columns))
	if bandRows < spreadsheetMinBandRows {
		bandRows = spreadsheetMinBandRows
	}
	if bandRows > spreadsheetMaxBandRows {
		bandRows = spreadsheetMaxBandRows
	}
	lastCol := spreadsheetColumnLetter(len(sheet.Columns))

	var parts []string
	startRow := 2
	for band := 0; band < spreadsheetMaxBands; band++ {
		endRow := startRow + int(bandRows) - 1
		rangeSpec := fmt.Sprintf("A%d:%s%d", startRow, lastCol, endRow)
		partPath := filepath.Join(dir, fmt.Sprintf("part_%03d.parquet", band))

		count, err := copySheetToParquet(dbFile, srcPath, sheet, rangeSpec, partPath)
		if err != nil {
			_ = os.Remove(partPath)
			return nil, err
		}
		if count == 0 {
			_ = os.Remove(partPath)
			break
		}
		parts = append(parts, partPath)
		startRow = endRow + 1
	}

	return parts, nil
}

// copySheetToParquet COPY 1 range của sheet sang parquet và trả về số dòng ghi được.
func copySheetToParquet(dbFile, srcPath string, sheet spreadsheetSheet, rangeSpec, outPath string) (int64, error) {
	sql := fmt.Sprintf(
		"COPY (SELECT %s FROM %s) TO '%s' (FORMAT PARQUET, COMPRESSION ZSTD); SELECT COUNT(*) AS cnt FROM read_parquet('%s')",
		spreadsheetSelectList(sheet.Columns),
		spreadsheetReadSQL(srcPath, sheet.Name, rangeSpec),
		escapeSingleQuote(outPath), escapeSingleQuote(outPath))

	stdout, err := runSpreadsheetDuckDB(dbFile, sql)
	if err != nil {
		return 0, err
	}

	for _, arr := range extractJSONArrays(stdout) {
		rows, _, err2 := parseJSONRows(arr)
		if err2 != nil || len(rows) == 0 {
			continue
		}
		switch v := rows[0]["cnt"].(type) {
		case float64:
			return int64(v), nil
		case string:
			var n int64
			if _, err := fmt.Sscanf(v, "%d", &n); err == nil {
				return n, nil
			}
		}
	}
	return 0, nil
}

// parquetReadExpr sinh biểu thức đọc các part parquet của 1 sheet.
func parquetReadExpr(parts []string) string {
	if len(parts) == 1 {
		return fmt.Sprintf("read_parquet('%s')", escapeSingleQuote(parts[0]))
	}
	quoted := make([]string, len(parts))
	for i, p := range parts {
		quoted[i] = fmt.Sprintf("'%s'", escapeSingleQuote(p))
	}
	return fmt.Sprintf("read_parquet([%s])", strings.Join(quoted, ", "))
}

// isLikelyOutOfMemory nhận diện lỗi do thiếu RAM khi đọc bảng tính.
//
// Rust abort tiến trình khi cấp phát thất bại ("memory allocation of N bytes
// failed") → SIGABRT/SIGKILL, đôi khi không có stderr. Chỉ khi gặp các dấu hiệu
// này ta mới giảm ngân sách ô mỗi lô rồi đọc lại; lỗi khác (file hỏng, sai định
// dạng) trả nguyên văn.
func isLikelyOutOfMemory(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	if strings.Contains(msg, "panicked") {
		// Panic của extension là lỗi dữ liệu, chia lô không giúp được gì.
		return false
	}
	for _, marker := range []string{
		"memory allocation",
		"out of memory",
		"cannot allocate",
		"not enough memory",
		"insufficient memory",
		"bad_alloc",
		"memoryerror",
	} {
		if strings.Contains(msg, marker) {
			return true
		}
	}

	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		if ws, ok := exitErr.Sys().(syscall.WaitStatus); ok && ws.Signaled() {
			switch ws.Signal() {
			case syscall.SIGABRT, syscall.SIGKILL:
				return true
			}
		}
	}
	return false
}

// removeStagedSheets xoá mọi file/thư mục tạm của các sheet đã convert.
func removeStagedSheets(sheets []stagedSheet) {
	for _, s := range sheets {
		if s.TempPath != "" {
			_ = os.RemoveAll(s.TempPath)
		}
	}
}
