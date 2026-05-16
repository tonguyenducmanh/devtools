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

// TDModelBase là interface bắt buộc cho mọi model muốn dùng TDDLBase.
type TDModelBase interface {
	// TableName trả về tên bảng trong database, vd: "td_api_mock"
	TableName() string
	// PrimaryKey trả về tên field JSON/db của khóa chính, vd: "id"
	PrimaryKey() string
}

// ─────────────────────────────────────────────────────────────────────────────
// TDDLBase[T] — generic repository, T phải implement TDModelBase
// ─────────────────────────────────────────────────────────────────────────────

type TDDLBase[T TDModelBase] struct{}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers — reflection utils
// ─────────────────────────────────────────────────────────────────────────────

// tdColumnInfo chứa thông tin 1 field đã được parse từ struct tag
type tdColumnInfo struct {
	fieldIndex []int  // vị trí field trong struct (slice để hỗ trợ embedded struct)
	dbColumn   string // tên cột trong DB (lấy từ tag `json:"..."`)
	isPrimaryKey       bool   // có phải khóa chính không
	isAutoSet  bool   // tự động sinh bởi DB, không tự insert/update
}

// parseColumns dùng reflection để đọc tất cả field của struct T, kể cả field từ embedded struct
func parseColumns[T TDModelBase]() []tdColumnInfo {
	var zero T
	pkName := zero.PrimaryKey()

	t := reflect.TypeOf(zero)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	var cols []tdColumnInfo
	// VisibleFields duyệt đệ quy qua embedded struct (giống kế thừa class base C#)
	for _, field := range reflect.VisibleFields(t) {
		tag := field.Tag.Get("json")
		if tag == "" || tag == "-" {
			continue
		}
		// Bỏ qua embedded struct container (vd: TDBaseModel), chỉ lấy các field con
		if field.Anonymous {
			continue
		}

		colName := strings.Split(tag, ",")[0]

		// Bỏ qua không tự insert/update các trường created_date, modified_date
		isAutoSet := colName == "created_date" || colName == "modified_date"

		cols = append(cols, tdColumnInfo{
			fieldIndex: field.Index, // slice path, hỗ trợ embedded struct
			dbColumn:   colName,
			isPrimaryKey:       colName == pkName,
			isAutoSet:  isAutoSet,
		})
	}
	return cols
}

func scanRow[T TDModelBase](rows *sql.Rows, cols []tdColumnInfo) (T, error) {
	var item T

	v := reflect.ValueOf(&item).Elem()
	ptrs := make([]any, len(cols))
	for i, col := range cols {
		ptrs[i] = v.FieldByIndex(col.fieldIndex).Addr().Interface()
	}

	err := rows.Scan(ptrs...)
	return item, err
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers — build SQL
// ─────────────────────────────────────────────────────────────────────────────

func buildSelectAll[T TDModelBase](cols []tdColumnInfo) string {
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

func buildSelectByPK[T TDModelBase](cols []tdColumnInfo) string {
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

func buildInsert[T TDModelBase](cols []tdColumnInfo) string {
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

func buildUpdate[T TDModelBase](cols []tdColumnInfo) string {
	var zero T
	var setClauses []string
	for _, c := range cols {
		if !c.isPrimaryKey && !c.isAutoSet {
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

func buildDelete[T TDModelBase]() string {
	var zero T
	return fmt.Sprintf(
		"DELETE FROM %s WHERE %s = ?",
		zero.TableName(),
		zero.PrimaryKey(),
	)
}

func extractValues[T TDModelBase](item *T, cols []tdColumnInfo) []any {
	v := reflect.ValueOf(item).Elem()
	var vals []any
	for _, c := range cols {
		if !c.isAutoSet {
			vals = append(vals, v.FieldByIndex(c.fieldIndex).Interface())
		}
	}
	return vals
}

func extractUpdateValues[T TDModelBase](item *T, cols []tdColumnInfo) []any {
	v := reflect.ValueOf(item).Elem()
	var vals []any
	var pkVal any
	for _, c := range cols {
		if c.isPrimaryKey {
			pkVal = v.FieldByIndex(c.fieldIndex).Interface()
		} else if !c.isAutoSet {
			vals = append(vals, v.FieldByIndex(c.fieldIndex).Interface())
		}
	}
	vals = append(vals, pkVal)
	return vals
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — các method của TDDLBase[T]
// ─────────────────────────────────────────────────────────────────────────────

func (r *TDDLBase[T]) GetAll() ([]T, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	cols := parseColumns[T]()
	sql := buildSelectAll[T](cols)
	rows, err := db.Query(sql)
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

func (r *TDDLBase[T]) GetByID(id any) (*T, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return nil, err
	}
	defer db.Close()

	cols := parseColumns[T]()
	sql := buildSelectByPK[T](cols)
	rows, err := db.Query(sql, id)
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

func (r *TDDLBase[T]) Insert(item *T) error {
	db, err := GetConnectionDB()
	if err != nil {
		return err
	}
	defer db.Close()

	cols := parseColumns[T]()

	// Auto-generate UUID if PK is string and empty
	v := reflect.ValueOf(item).Elem()
	for _, c := range cols {
		if c.isPrimaryKey {
			field := v.FieldByIndex(c.fieldIndex)
			if field.Kind() == reflect.String && field.String() == "" {
				field.SetString(td_common.GenUUID())
			}
		}
	}

	vals := extractValues(item, cols)
	sql := buildInsert[T](cols)
	_, err = db.Exec(sql, vals...)
	return err
}

func (r *TDDLBase[T]) InsertBatch(items []T) error {
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
			if c.isPrimaryKey {
				field := v.FieldByIndex(c.fieldIndex)
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

func (r *TDDLBase[T]) InsertOrIgnoreBatch(items []T) error {
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
			if c.isPrimaryKey {
				field := v.FieldByIndex(c.fieldIndex)
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

func (r *TDDLBase[T]) Update(item *T) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	cols := parseColumns[T]()
	sql := buildUpdate[T](cols)
	vals := extractUpdateValues(item, cols)
	result, err := db.Exec(sql, vals...)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

func (r *TDDLBase[T]) UpdateBatch(items []T) error {
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

func (r *TDDLBase[T]) Delete(id any) (int64, error) {
	db, err := GetConnectionDB()
	if err != nil {
		return 0, err
	}
	defer db.Close()

	sql := buildDelete[T]()
	result, err := db.Exec(sql, id)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

func (r *TDDLBase[T]) DeleteBatch(ids []any) error {
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

func (r *TDDLBase[T]) QueryRaw(query string, args ...any) ([]map[string]any, error) {
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

func (r *TDDLBase[T]) ExecRaw(query string, args ...any) (int64, error) {
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
