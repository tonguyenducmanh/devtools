package database

import (
	"database/sql"
	"embed"
	"io/fs"
	"log"
	"sort"
	"strings"

	_ "modernc.org/sqlite"
)

// migrations chứa toàn bộ script SQL tạo / nâng cấp schema.
//
// Toàn bộ logic schema nằm trong file .sql, không nằm trong code Go.
// Thêm migration mới = thêm 1 file .sql mới, không sửa file này.
//
// Quy ước đặt tên file: <số thứ tự>_<mô tả>.sql — runner chạy theo thứ tự
// tên file tăng dần, nên số thứ tự phải tăng dần và không dùng lại số cũ.
//
//go:embed migrations/*.sql
var migrations embed.FS

// InitDatabase khởi tạo và nâng cấp database nếu chưa có.
func InitDatabase() {
	db, err := GetConnectionDB()
	if err != nil {
		log.Fatal(err)
	}

	if err = applyMigrations(db); err != nil {
		log.Fatal(err)
	}
}

// applyMigrations chạy toàn bộ file .sql trong thư mục migrations theo thứ tự tên.
//
// Script được viết idempotent nên chạy mỗi lần khởi động đều an toàn,
// không cần bảng lưu version đã migrate.
func applyMigrations(db *sql.DB) error {
	names, err := fs.Glob(migrations, "migrations/*.sql")
	if err != nil {
		return err
	}
	// Thứ tự tên file là thứ tự chạy, 0001 trước 0002
	sort.Strings(names)

	for _, name := range names {
		content, err := migrations.ReadFile(name)
		if err != nil {
			return err
		}
		for _, statement := range splitSQLStatements(string(content)) {
			if _, err := db.Exec(statement); err != nil && !isAlreadyAppliedError(err) {
				return err
			}
		}
	}
	return nil
}

// splitSQLStatements tách 1 file .sql thành từng câu lệnh riêng biệt.
//
// Bỏ qua comment dòng (-- ...) và comment khối (/* ... */), rồi cắt theo dấu ;
// ở cuối câu. Chỉ dùng được với SQL không chứa literal dạng chuỗi, đủ dùng cho
// các file migration của app.
func splitSQLStatements(script string) []string {
	// Bỏ comment khối trước để không vướng phân tích dấu ; bên trong
	script = stripBlockComments(script)

	var statements []string
	var current strings.Builder

	// flush chốt câu lệnh đang tích luỹ vào kết quả
	flush := func() {
		if statement := strings.TrimSpace(current.String()); statement != "" {
			statements = append(statements, statement)
		}
		current.Reset()
	}

	for _, line := range strings.Split(script, "\n") {
		// Bỏ comment dòng
		if index := strings.Index(line, "--"); index >= 0 {
			line = line[:index]
		}
		if strings.TrimSpace(line) == "" {
			continue
		}

		current.WriteString(line)
		current.WriteString("\n")

		// Cắt tại dấu ; ở cuối câu
		if strings.HasSuffix(strings.TrimSpace(line), ";") {
			flush()
		}
	}

	// Câu lệnh cuối cùng không có dấu ; ở cuối file
	flush()

	return statements
}

// stripBlockComments xoá comment khối /* ... */ trong script SQL
func stripBlockComments(script string) string {
	var result strings.Builder
	remaining := script

	for {
		start := strings.Index(remaining, "/*")
		if start == -1 {
			result.WriteString(remaining)
			return result.String()
		}
		result.WriteString(remaining[:start])
		end := strings.Index(remaining[start:], "*/")
		if end == -1 {
			// Comment khối chưa đóng, bỏ hết phần còn lại
			return result.String()
		}
		remaining = remaining[start+end+2:]
	}
}

// isAlreadyAppliedError kiểm tra lỗi SQLite "cột đã tồn tại" và có thể bỏ qua.
//
// SQLite không hỗ trợ "ADD COLUMN IF NOT EXISTS" nên câu ALTER sẽ luôn lỗi
// trên database đã có cột đó — đây là trường hợp bình thường, không phải lỗi.
// Mọi lỗi khác vẫn được trả về để ghi log.
func isAlreadyAppliedError(err error) bool {
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "duplicate column name")
}
