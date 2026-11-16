package duckdb

import (
	"archive/zip"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// testSheet là 1 sheet dùng cho test: tên + các dòng dữ liệu (dòng đầu là header).
type testSheet struct {
	name string
	rows [][]string
}

// writeTestODS sinh file .ods tối giản (đủ để calamine/rusty_sheet đọc được).
//
// sentinelRows > 0 sẽ thêm dòng "sentinel" đúng như LibreOffice/Excel ghi ở cuối
// mỗi sheet: table:number-rows-repeated=1048576 + ô rỗng <text:p/>. Đây chính là
// dòng từng làm go-ods nở ra 1.048.576 dòng x 1024 cột ⇒ tràn RAM.
func writeTestODS(t *testing.T, dir, name string, sheets []testSheet, sentinelRows int) string {
	t.Helper()

	var content strings.Builder
	content.WriteString(`<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
 xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 office:version="1.2">
<office:body><office:spreadsheet>
`)
	for _, sh := range sheets {
		fmt.Fprintf(&content, "<table:table table:name=%q>", sh.name)
		for _, row := range sh.rows {
			content.WriteString("<table:table-row>")
			for _, cell := range row {
				content.WriteString(`<table:table-cell office:value-type="string"><text:p>`)
				content.WriteString(xmlEscape(cell))
				content.WriteString(`</text:p></table:table-cell>`)
			}
			content.WriteString("</table:table-row>")
		}
		if sentinelRows > 0 {
			fmt.Fprintf(&content,
				`<table:table-row table:number-rows-repeated="%d"><table:table-cell table:number-columns-repeated="1024"><text:p/></table:table-cell></table:table-row>`,
				sentinelRows)
		}
		content.WriteString("</table:table>")
	}
	content.WriteString("</office:spreadsheet></office:body></office:document-content>")

	manifest := `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
 <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
 <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`

	outPath := filepath.Join(dir, name)
	f, err := os.Create(outPath)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()

	zw := zip.NewWriter(f)
	// mimetype phải là entry đầu tiên, không nén.
	mw, err := zw.CreateHeader(&zip.FileHeader{Name: "mimetype", Method: zip.Store})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := mw.Write([]byte("application/vnd.oasis.opendocument.spreadsheet")); err != nil {
		t.Fatal(err)
	}
	// KHÔNG được thiếu manifest: rusty_sheet panic (abort) khi file .ods không có nó.
	for _, entry := range []struct{ name, body string }{
		{"content.xml", content.String()},
		{"META-INF/manifest.xml", manifest},
	} {
		w, err := zw.Create(entry.name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := w.Write([]byte(entry.body)); err != nil {
			t.Fatal(err)
		}
	}
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	return outPath
}

func xmlEscape(s string) string {
	r := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;")
	return r.Replace(s)
}

// requireSpreadsheetExt bỏ qua test nếu daemon build không kèm extension rusty_sheet
// (clone mới chưa chạy scripts/fetch/fetch_duckdb_extensions.sh).
func requireSpreadsheetExt(t *testing.T) {
	t.Helper()
	if _, err := getSpreadsheetExtensionPath(); err != nil {
		t.Skipf("không có extension rusty_sheet: %v", err)
	}
}

// TestSpreadsheetSentinelNotExpanded là test hồi quy cho bug gốc: dòng sentinel
// number-rows-repeated=1048576 ở cuối sheet KHÔNG được nở thành 1 triệu dòng.
// Trước khi sửa, file 3 sheet x 3 dòng như vậy làm daemon treo/tràn RAM.
func TestSpreadsheetSentinelNotExpanded(t *testing.T) {
	requireSpreadsheetExt(t)

	header := []string{"id", "ten", "so"}
	sheets := []testSheet{
		{"Mot", [][]string{header, {"1", "a", "10"}, {"2", "b", "20"}}},
		{"Hai", [][]string{header, {"3", "c", "30"}}},
		{"Ba", [][]string{header, {"4", "d", "40"}, {"5", "e", "50"}}},
	}
	path := writeTestODS(t, t.TempDir(), "sentinel.ods", sheets, 1048576)

	sessionID := "test_sentinel_ods"
	defer DropSession(sessionID)

	results, err := LoadFile(sessionID, path, "sentinel", "f1", "sentinel.ods")
	if err != nil {
		t.Fatalf("LoadFile lỗi: %v", err)
	}
	if len(results) != len(sheets) {
		t.Fatalf("mong đợi %d bảng, nhận %d: %+v", len(sheets), len(results), results)
	}

	wantRows := map[string]int64{"sentinel_mot": 2, "sentinel_hai": 1, "sentinel_ba": 2}
	var firstCols []string
	for _, r := range results {
		if got, ok := wantRows[r.TableName]; ok && r.RowCount != got {
			t.Errorf("bảng %s: mong đợi %d dòng, nhận %d (sentinel bị nở?)", r.TableName, got, r.RowCount)
		}
		if r.TempPath == "" {
			t.Errorf("bảng %s: thiếu TempPath để dọn dẹp", r.TableName)
		}
		if r.TableName == "sentinel_mot" {
			firstCols = r.Columns
		}
	}

	// Cột phải đúng theo header (không thành A, B, C…) và giữ nguyên thứ tự.
	if len(firstCols) != 3 || firstCols[0] != "id" || firstCols[1] != "ten" || firstCols[2] != "so" {
		t.Errorf("cột không đúng: %v", firstCols)
	}
}

// TestSpreadsheetBandsKeepRowsAfterBlank kiểm tra chia lô không làm mất dữ liệu
// khi có dòng trống ở GIỮA sheet (skip_empty_rows bỏ dòng trống nên lô "không đầy"
// không có nghĩa là đã hết dữ liệu).
func TestSpreadsheetBandsKeepRowsAfterBlank(t *testing.T) {
	requireSpreadsheetExt(t)

	const dataRows = 5000
	const blankAt = 2500
	rows := [][]string{{"id", "ten"}}
	for i := 0; i < dataRows; i++ {
		if i == blankAt {
			rows = append(rows, []string{}) // dòng trống giữa sheet
		}
		rows = append(rows, []string{fmt.Sprintf("%d", i), fmt.Sprintf("dong %d", i)})
	}
	path := writeTestODS(t, t.TempDir(), "bands.ods", []testSheet{{"Data", rows}}, 0)

	sessionID := "test_bands_ods"
	defer DropSession(sessionID)

	dbFile := filepath.Join(t.TempDir(), "test.duckdb")
	sheet, err := analyzeSpreadsheet(dbFile, path)
	if err != nil {
		t.Fatalf("analyzeSpreadsheet lỗi: %v", err)
	}
	if len(sheet) != 1 || len(sheet[0].Columns) != 2 {
		t.Fatalf("analyze không đúng: %+v", sheet)
	}

	// Ngân sách 4000 ô/lô với 2 cột ⇒ 2000 dòng/lô (chạm sàn MinBandRows)
	// ⇒ 3 lô cho 5000 dòng, dòng trống nằm trong lô 2.
	dir := t.TempDir()
	parts, err := writeSheetBands(dbFile, path, sheet[0], dir, 4000)
	if err != nil {
		t.Fatalf("writeSheetBands lỗi: %v", err)
	}
	if len(parts) != 3 {
		t.Fatalf("mong đợi 3 lô, nhận %d", len(parts))
	}

	var total int64
	for _, p := range parts {
		n, err := countParquetRows(p)
		if err != nil {
			t.Fatalf("đếm %s lỗi: %v", p, err)
		}
		total += n
	}
	if total != dataRows {
		t.Fatalf("mất dữ liệu khi chia lô: mong đợi %d dòng, nhận %d", dataRows, total)
	}
}

// countParquetRows đếm số dòng của 1 file parquet (không cần extension).
func countParquetRows(path string) (int64, error) {
	sql := fmt.Sprintf("SELECT COUNT(*) AS cnt FROM read_parquet('%s')", escapeSingleQuote(path))
	stdout, _, err := runDuckDB("", sql)
	if err != nil {
		return 0, err
	}
	for _, arr := range extractJSONArrays(stdout) {
		rows, _, err2 := parseJSONRows(arr)
		if err2 != nil || len(rows) == 0 {
			continue
		}
		if v, ok := rows[0]["cnt"].(float64); ok {
			return int64(v), nil
		}
	}
	return 0, nil
}
