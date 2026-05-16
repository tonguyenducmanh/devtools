package database

import (
	"database/sql"
	"fmt"
	"reflect"
	"strings"
	"td_core_service/td_common"
)

// ─────────────────────────────────────────────────────────────────────────────
// Marker interface – mỗi model cần implement để khai báo metadata
// ─────────────────────────────────────────────────────────────────────────────

// DBModel là interface bắt buộc cho mọi model muốn dùng BaseRepository.
type DBModel interface {
	// TableName trả về tên bảng trong database, vd: "td_api_mock"
	TableName() string
	// PrimaryKey trả về tên field JSON/db của khóa chính, vd: "id"
	PrimaryKey() string
}

// ─────────────────────────────────────────────────────────────────────────────
// BaseRepository[T] — generic repository, T phải implement DBModel
// ─────────────────────────────────────────────────────────────────────────────

type BaseRepository[T DBModel] struct{}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers — reflection utils
// ─────────────────────────────────────────────────────────────────────────────

// columnMeta chứa thông tin 1 field đã được parse từ struct tag
type columnMeta struct {
	fieldIndex int    // vị trí field trong struct
	dbColumn   string // tên cột trong DB (lấy từ tag `json:"..."`)
	isPK       bool   // có phải khóa chính không
	isAutoSet  bool   // tự động sinh bởi DB, không tự insert/update
}

// parseColumns dùng reflection để đọc tất cả field của struct T
func parseColumns[T DBModel]() []columnMeta {
	var zero T
	pkName := zero.PrimaryKey()

	t := reflect.TypeOf(zero)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	var cols []columnMeta
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		tag := field.Tag.Get("json")
		if tag == "" || tag == "-" {
			continue
		}
		
		colName := strings.Split(tag, ",")[0]
		
		// Bỏ qua không tự insert/update các trường created_date, modified_date
		isAutoSet := colName == "created_date" || colName == "modified_date"

		cols = append(cols, columnMeta{
			fieldIndex: i,
			dbColumn:   colName,
			isPK:       colName == pkName,
			isAutoSet:  isAutoSet,
		})
	}
	return cols
}

func scanRow[T DBModel](rows *sql.Rows, cols []columnMeta) (T, error) {
	var item T

	v := reflect.ValueOf(&item).Elem()
	ptrs := make([]any, len(cols))
	for i, col := range cols {
		ptrs[i] = v.Field(col.fieldIndex).Addr().Interface()
	}

	err := rows.Scan(ptrs...)
	return item, err
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers — build SQL
// ─────────────────────────────────────────────────────────────────────────────

func buildSelectAll[T DBModel](cols []columnMeta) string {
	var zero T
	colNames := make([]string, len(cols))
	for i, c := range cols {
		colNames[i] = c.dbColumn
	}
	return fmt.Sprintf(
		"SELECT %s FROM %s ORDER BY created_date DESC",
		strings.Join(colNames, ", "),
		zero.TableName(),
	)
}

func buildSelectByPK[T DBModel](cols []columnMeta) string {
	var zero T
	colNames := make([]string, len(cols))
	for i, c := range cols {
		colNames[i] = c.dbColumn
	}
	return fmt.Sprintf(
		"SELECT %s FROM %s WHERE %s = ?",
		strings.Join(colNames, ", "),
		zero.TableName(),
		zero.PrimaryKey(),
	)
}

func buildInsert[T DBModel](cols []columnMeta) string {
	var zero T
	var colNames []string
	var placeholders []string
	for _, c := range cols {
		if !c.isAutoSet {
			colNames = append(colNames, c.dbColumn)
			placeholders = append(placeholders, "?")
		}
	}
	return fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s)",
		zero.TableName(),
		strings.Join(colNames, ", "),
		strings.Join(placeholders, ", "),
	)
}

func buildUpdate[T DBModel](cols []columnMeta) string {
	var zero T
	var setClauses []string
	for _, c := range cols {
		if !c.isPK && !c.isAutoSet {
			setClauses = append(setClauses, fmt.Sprintf("%s = ?", c.dbColumn))
		}
	}
	
	setClauses = append(setClauses, "modified_date = CURRENT_TIMESTAMP")
	return fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s = ?",
		zero.TableName(),
		strings.Join(setClauses, ", "),
		zero.PrimaryKey(),
	)
}

func buildDelete[T DBModel]() string {
	var zero T
	return fmt.Sprintf(
		"DELETE FROM %s WHERE %s = ?",
		zero.TableName(),
		zero.PrimaryKey(),
	)
}

func extractValues[T DBModel](item *T, cols []columnMeta) []any {
	v := reflect.ValueOf(item).Elem()
	var vals []any
	for _, c := range cols {
		if !c.isAutoSet {
			vals = append(vals, v.Field(c.fieldIndex).Interface())
		}
	}
	return vals
}

func extractUpdateValues[T DBModel](item *T, cols []columnMeta) []any {
	v := reflect.ValueOf(item).Elem()
	var vals []any
	var pkVal any
	for _, c := range cols {
		if c.isPK {
			pkVal = v.Field(c.fieldIndex).Interface()
		} else if !c.isAutoSet {
			vals = append(vals, v.Field(c.fieldIndex).Interface())
		}
	}
	vals = append(vals, pkVal)
	return vals
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — các method của BaseRepository[T]
// ─────────────────────────────────────────────────────────────────────────────

func (r *BaseRepository[T]) GetAll() ([]T, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	cols := parseColumns[T]()
	rows, err := db.Query(buildSelectAll[T](cols))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []T
	for rows.Next() {
		item, err := scanRow[T](rows, cols)
		if err != nil {
			continue
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *BaseRepository[T]) GetByID(id any) (*T, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	cols := parseColumns[T]()
	rows, err := db.Query(buildSelectByPK[T](cols), id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if rows.Next() {
		item, err := scanRow[T](rows, cols)
		if err != nil {
			return nil, err
		}
		return &item, nil
	}
	return nil, nil // not found
}

func (r *BaseRepository[T]) Insert(item *T) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	cols := parseColumns[T]()

	// Auto-generate UUID if PK is string and empty
	v := reflect.ValueOf(item).Elem()
	for _, c := range cols {
		if c.isPK {
			field := v.Field(c.fieldIndex)
			if field.Kind() == reflect.String && field.String() == "" {
				field.SetString(td_common.GenUUID())
			}
		}
	}

	vals := extractValues(item, cols)
	_, err = db.Exec(buildInsert[T](cols), vals...)
	return err
}

func (r *BaseRepository[T]) InsertBatch(items []T) error {
	if len(items) == 0 {
		return nil
	}

	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	cols := parseColumns[T]()
	sql := buildInsert[T](cols)

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(sql)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for i := range items {
		v := reflect.ValueOf(&items[i]).Elem()
		for _, c := range cols {
			if c.isPK {
				field := v.Field(c.fieldIndex)
				if field.Kind() == reflect.String && field.String() == "" {
					field.SetString(td_common.GenUUID())
				}
			}
		}
		vals := extractValues(&items[i], cols)
		if _, err = stmt.Exec(vals...); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (r *BaseRepository[T]) InsertOrIgnoreBatch(items []T) error {
	if len(items) == 0 {
		return nil
	}

	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	cols := parseColumns[T]()
	rawSQL := strings.Replace(buildInsert[T](cols), "INSERT INTO", "INSERT OR IGNORE INTO", 1)

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(rawSQL)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for i := range items {
		v := reflect.ValueOf(&items[i]).Elem()
		for _, c := range cols {
			if c.isPK {
				field := v.Field(c.fieldIndex)
				if field.Kind() == reflect.String && field.String() == "" {
					field.SetString(td_common.GenUUID())
				}
			}
		}
		vals := extractValues(&items[i], cols)
		if _, err = stmt.Exec(vals...); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (r *BaseRepository[T]) Update(item *T) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	cols := parseColumns[T]()
	vals := extractUpdateValues(item, cols)
	result, err := db.Exec(buildUpdate[T](cols), vals...)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

func (r *BaseRepository[T]) UpdateBatch(items []T) error {
	if len(items) == 0 {
		return nil
	}

	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	cols := parseColumns[T]()
	rawSQL := buildUpdate[T](cols)

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(rawSQL)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for i := range items {
		vals := extractUpdateValues(&items[i], cols)
		if _, err = stmt.Exec(vals...); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (r *BaseRepository[T]) Delete(id any) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	result, err := db.Exec(buildDelete[T](), id)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

func (r *BaseRepository[T]) DeleteBatch(ids []any) error {
	if len(ids) == 0 {
		return nil
	}

	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	rawSQL := buildDelete[T]()

	tx, err := db.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(rawSQL)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, id := range ids {
		if _, err = stmt.Exec(id); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (r *BaseRepository[T]) QueryRaw(query string, args ...any) ([]map[string]any, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var results []map[string]any
	for rows.Next() {
		values := make([]any, len(columns))
		valuePtrs := make([]any, len(columns))
		for i := range columns {
			valuePtrs[i] = &values[i]
		}
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, err
		}
		rowMap := make(map[string]any)
		for i, col := range columns {
			if b, ok := values[i].([]byte); ok {
				rowMap[col] = string(b)
			} else {
				rowMap[col] = values[i]
			}
		}
		results = append(results, rowMap)
	}
	return results, nil
}

func (r *BaseRepository[T]) ExecRaw(query string, args ...any) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	result, err := db.Exec(query, args...)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}
