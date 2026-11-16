package duckdb

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
)

// TestIsIllegalInstruction_SIGILL kiểm tra nhận diện SIGILL (illegal instruction).
//
// Dùng `kill -ILL` để tạo tiến trình chết đúng bằng SIGILL — mô phỏng chính xác
// trường hợp DuckDB CLI build cho x86-64-v3 crash trên CPU thiếu AVX2.
func TestIsIllegalInstruction_SIGILL(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("kill -ILL không dùng được trên Windows")
	}

	// /bin/sh -c 'kill -ILL $$' → tiến trình tự giết mình bằng SIGILL.
	cmd := exec.Command("/bin/sh", "-c", "kill -ILL $$")
	err := cmd.Run()
	if err == nil {
		t.Fatal("kỳ vọng lệnh bị giết bằng signal nhưng lại chạy thành công")
	}
	if !isIllegalInstruction(err) {
		t.Fatalf("kỳ vọng nhận diện SIGILL, nhưng không nhận ra: %v", err)
	}
}

// TestIsIllegalInstruction_NormalExit kiểm tra lỗi thường KHÔNG bị nhầm là SIGILL.
func TestIsIllegalInstruction_NormalExit(t *testing.T) {
	cmd := exec.Command("/bin/sh", "-c", "exit 3")
	err := cmd.Run()
	if err == nil {
		t.Fatal("kỳ vọng lệnh exit 3 trả về lỗi")
	}
	if isIllegalInstruction(err) {
		t.Fatalf("exit code bình thường bị nhầm là SIGILL: %v", err)
	}
}

// TestIsIllegalInstruction_NotExitError kiểm tra lỗi không phải ExitError.
func TestIsIllegalInstruction_NotExitError(t *testing.T) {
	if isIllegalInstruction(errors.New("lỗi bất kỳ")) {
		t.Fatal("lỗi thường bị nhầm là SIGILL")
	}
}

// TestIsIllegalInstruction_Nil kiểm tra nil không gây panic.
func TestIsIllegalInstruction_Nil(t *testing.T) {
	if isIllegalInstruction(nil) {
		t.Fatal("nil bị nhầm là SIGILL")
	}
}

// TestProbeDuckDBCLI_OK kiểm tra probe trả nil khi binary chạy được.
func TestProbeDuckDBCLI_OK(t *testing.T) {
	if _, err := getEmbeddedDuckDBCLI(); err != nil {
		t.Skipf("không có DuckDB CLI embedded để test: %v", err)
	}
	cliPath, err := getEmbeddedDuckDBCLI()
	if err != nil {
		t.Fatalf("lấy CLI embedded thất bại: %v", err)
	}
	if err := probeDuckDBCLI(cliPath); err != nil {
		t.Fatalf("probe CLI hợp lệ thất bại: %v", err)
	}
}

// TestProbeDuckDBCLI_NotExecutable kiểm tra probe báo lỗi khi binary không chạy được.
func TestProbeDuckDBCLI_NotExecutable(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "duckdb")
	if err := os.WriteFile(tmp, []byte("#!/bin/sh\nexit 1\n"), 0755); err != nil {
		t.Fatalf("ghi file test thất bại: %v", err)
	}
	err := probeDuckDBCLI(tmp)
	if err == nil {
		t.Fatal("kỳ vọng probe thất bại với binary không hợp lệ")
	}
	var cpuErr *cpuUnsupportedError
	if errors.As(err, &cpuErr) {
		t.Fatalf("lỗi thường bị nhầm là CPU không hỗ trợ: %v", err)
	}
}

// TestLoadFile_CSVEndToEnd kiểm tra nạp file CSV thật và query được.
// Đây là smoke test cho luồng "Lỗi nạp file vào DuckDB" mà user gặp phải.
func TestLoadFile_CSVEndToEnd(t *testing.T) {
	if _, err := getEmbeddedDuckDBCLI(); err != nil {
		t.Skipf("không có DuckDB CLI embedded để test: %v", err)
	}

	tmp := filepath.Join(t.TempDir(), "data.csv")
	content := "col_a,col_b\n00123,x\n00456,y\n"
	if err := os.WriteFile(tmp, []byte(content), 0644); err != nil {
		t.Fatalf("ghi CSV thất bại: %v", err)
	}

	sessionID := "test-session-csv"
	defer DropSession(sessionID)

	results, err := LoadFile(sessionID, tmp, "event_accounting_raw", "file-1", "data.csv")
	if err != nil {
		t.Fatalf("LoadFile thất bại: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("kỳ vọng 1 view, nhận được %d", len(results))
	}
	res := results[0]
	if res.TableName != "event_accounting_raw" {
		t.Errorf("tên view sai: %s", res.TableName)
	}
	if res.RowCount != 2 {
		t.Errorf("số dòng sai: %d (kỳ vọng 2)", res.RowCount)
	}
	if len(res.Columns) != 2 {
		t.Errorf("số cột sai: %v", res.Columns)
	}
}

func TestCollectResultSets_MultipleArrays(t *testing.T) {
	stdout := []byte("[{\"a\":1}]\n[{\"b\":2},{\"b\":3}]\n")
	result, err := collectResultSets(stdout, 0)
	if err != nil {
		t.Fatalf("collectResultSets thất bại: %v", err)
	}
	if len(result.Results) != 2 {
		t.Fatalf("kỳ vọng 2 result set, nhận %d", len(result.Results))
	}
	if !result.Results[0].IsSelect || len(result.Results[0].Rows) != 1 {
		t.Errorf("result set 1 sai: %+v", result.Results[0])
	}
	if !result.Results[1].IsSelect || len(result.Results[1].Rows) != 2 {
		t.Errorf("result set 2 sai: %+v", result.Results[1])
	}
}

func TestCollectResultSets_TruncatesAtBackend(t *testing.T) {
	stdout := []byte("[{\"n\":1},{\"n\":2},{\"n\":3}]\n")
	result, err := collectResultSets(stdout, 2)
	if err != nil {
		t.Fatalf("collectResultSets thất bại: %v", err)
	}
	if len(result.Results) != 1 || len(result.Results[0].Rows) != 2 {
		t.Fatalf("kỳ vọng 1 result set bị cắt còn 2 dòng, nhận %+v", result.Results)
	}
	if result.Results[0].RowsAffected != 2 {
		t.Errorf("RowsAffected sai: %d", result.Results[0].RowsAffected)
	}
}

func TestCollectResultSets_IgnoresNonResultStatements(t *testing.T) {
	// Câu không trả result set không in mảng JSON -> không tạo phần tử.
	stdout := []byte("")
	result, err := collectResultSets(stdout, 0)
	if err != nil {
		t.Fatalf("collectResultSets thất bại: %v", err)
	}
	if len(result.Results) != 0 {
		t.Fatalf("kỳ vọng 0 result set, nhận %d", len(result.Results))
	}
}

func TestExecuteQuery_MultiStatement(t *testing.T) {
	if _, err := getEmbeddedDuckDBCLI(); err != nil {
		t.Skipf("không có DuckDB CLI embedded để test: %v", err)
	}

	sessionID := "test-session-multi"
	defer DropSession(sessionID)

	// Script chạy 1 lần, không tách statement. DDL/INSERT không in mảng JSON
	// nên chỉ các câu có result set (2 SELECT) tạo phần tử Results.
	sql := "CREATE TABLE t(a INT); INSERT INTO t VALUES (1),(2); SELECT * FROM t ORDER BY a; SELECT count(*) AS c FROM t"
	result, err := ExecuteQuery(sessionID, sql, 0, false)
	if err != nil {
		t.Fatalf("ExecuteQuery thất bại: %v", err)
	}
	if len(result.Results) != 2 {
		t.Fatalf("kỳ vọng 2 result set, nhận %d", len(result.Results))
	}
	if !result.Results[0].IsSelect || len(result.Results[0].Rows) != 2 {
		t.Errorf("SELECT * sai: %+v", result.Results[0])
	}
	if !result.Results[1].IsSelect || len(result.Results[1].Rows) != 1 {
		t.Errorf("SELECT count sai: %+v", result.Results[1])
	}
}

func TestExecuteQuery_BackendLimit(t *testing.T) {
	if _, err := getEmbeddedDuckDBCLI(); err != nil {
		t.Skipf("không có DuckDB CLI embedded để test: %v", err)
	}

	sessionID := "test-session-limit"
	defer DropSession(sessionID)

	sql := "SELECT i FROM range(0, 5) t(i)"
	limited, err := ExecuteQuery(sessionID, sql, 2, false)
	if err != nil {
		t.Fatalf("ExecuteQuery thất bại: %v", err)
	}
	if len(limited.Results) != 1 || len(limited.Results[0].Rows) != 2 {
		t.Fatalf("kỳ vọng bị cắt còn 2 dòng, nhận %+v", limited.Results)
	}

	// Query có LIMIT thì không cắt thêm ở backend.
	sqlWithLimit := "SELECT i FROM range(0, 5) t(i) LIMIT 4"
	withLimit, err := ExecuteQuery(sessionID, sqlWithLimit, 2, false)
	if err != nil {
		t.Fatalf("ExecuteQuery (có LIMIT) thất bại: %v", err)
	}
	if len(withLimit.Results) != 1 || len(withLimit.Results[0].Rows) != 4 {
		t.Fatalf("query có LIMIT không được cắt thêm, nhận %+v", withLimit.Results)
	}
}
