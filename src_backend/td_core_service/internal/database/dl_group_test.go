package database

import (
	"database/sql"
	"testing"

	_ "modernc.org/sqlite"
)

// testGroup là model master tối giản để test, đúng chuẩn TDGroup:
// bắt buộc có id (GetID) và tên (GetName).
type testGroup struct {
	id   string
	name string
}

func (g testGroup) TableName() string  { return "td_test_group" }
func (g testGroup) PrimaryKey() string { return "id" }
func (g testGroup) GetID() string      { return g.id }
func (g testGroup) GetName() string    { return g.name }

// testItem là model detail tối giản, đúng chuẩn TDGroupedItem: có group_id
type testItem struct {
	id      string
	name    string
	groupID string
}

func (i testItem) TableName() string  { return "td_test_item" }
func (i testItem) PrimaryKey() string { return "id" }
func (i testItem) GetGroupID() string { return i.groupID }

func TestSplitSQLStatements(t *testing.T) {
	script := `
-- comment dòng
CREATE TABLE IF NOT EXISTS a (
	id TEXT
);   -- comment sau dấu chấm phẩy

/* comment khối;
   nhiều dòng */
CREATE TABLE IF NOT EXISTS b (id TEXT);

ALTER TABLE b ADD COLUMN name TEXT
`
	got := splitSQLStatements(script)
	want := []string{
		"CREATE TABLE IF NOT EXISTS a (\n\tid TEXT\n);",
		"CREATE TABLE IF NOT EXISTS b (id TEXT);",
		"ALTER TABLE b ADD COLUMN name TEXT",
	}

	if len(got) != len(want) {
		t.Fatalf("số câu lệnh: got %d want %d\n%#v", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("câu %d:\n got=%q\nwant=%q", i, got[i], want[i])
		}
	}
}

func TestGroupRowsIntoTree(t *testing.T) {
	tree := GroupRowsIntoTree(
		[]testGroup{{id: "g1", name: "G1"}, {id: "g2", name: "G2"}},
		[]testItem{
			{id: "i1", name: "I1", groupID: "g1"},
			{id: "i2", name: "I2", groupID: "g1"},
			{id: "i3", name: "I3", groupID: "g2"},
			{id: "i4", name: "I4", groupID: ""},     // chưa gán group
			{id: "i5", name: "I5", groupID: "gone"}, // group đã bị xoá
		},
	)

	// 2 group thật + 1 node ungrouped gộp cả i4 và i5
	if len(tree) != 3 {
		t.Fatalf("số node: got %d want 3", len(tree))
	}
	if len(tree[0].Items) != 2 || tree[0].Items[0].name != "I1" || tree[0].Items[1].name != "I2" {
		t.Errorf("items của g1 sai: %#v", tree[0].Items)
	}
	if len(tree[1].Items) != 1 || tree[1].Items[0].name != "I3" {
		t.Errorf("items của g2 sai: %#v", tree[1].Items)
	}
	if !tree[2].IsUngrouped {
		t.Error("node cuối phải là ungrouped")
	}
	if len(tree[2].Items) != 2 {
		t.Errorf("ungrouped phải gom cả i4 và i5, got %#v", tree[2].Items)
	}

	// group thật không được đánh dấu ungrouped, items luôn là mảng không null
	for i := 0; i < 2; i++ {
		if tree[i].IsUngrouped {
			t.Errorf("node %d không được là ungrouped", i)
		}
		if tree[i].Items == nil {
			t.Errorf("node %d items phải là mảng rỗng chứ không phải nil", i)
		}
	}
}

// Không có item mồ côi thì không được tạo node ungrouped rỗng làm nhiễu UI
func TestGroupRowsIntoTreeSkipsEmptyUngrouped(t *testing.T) {
	tree := GroupRowsIntoTree(
		[]testGroup{{id: "g1", name: "G1"}},
		[]testItem{{id: "i1", name: "I1", groupID: "g1"}},
	)
	if len(tree) != 1 {
		t.Fatalf("got %d node, want 1", len(tree))
	}
}

// Group đã tồn tại nhưng không có item thì vẫn phải hiện ra trên UI
func TestGroupRowsIntoTreeKeepsEmptyGroup(t *testing.T) {
	tree := GroupRowsIntoTree[testGroup, testItem](
		[]testGroup{{id: "g1", name: "G1"}, {id: "g2", name: "G2"}},
		[]testItem{},
	)
	if len(tree) != 2 {
		t.Fatalf("got %d node, want 2", len(tree))
	}
	for i := range tree {
		if len(tree[i].Items) != 0 {
			t.Errorf("node %d phải rỗng items", i)
		}
	}
}

// Migration phải chạy được trên database rỗng và chạy lại nhiều lần vẫn không lỗi
// (script idempotent), vì app chạy applyMigrations ở mỗi lần khởi động.
func TestApplyMigrationsIsIdempotent(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	// Giữ 1 connection để database in-memory không bị mất giữa các câu lệnh
	db.SetMaxOpenConns(1)

	// Chạy 3 lần: lần đầu tạo mới, 2 lần sau phải không lỗi
	for i := 1; i <= 3; i++ {
		if err := applyMigrations(db); err != nil {
			t.Fatalf("lần chạy %d: %v", i, err)
		}
	}

	// Mọi bảng master-detail phải tồn tại
	expectedTables := []string{
		"td_api_testing_group", "td_api_testing",
		"td_api_testing_pro_mode_group", "td_api_testing_pro_mode",
		"td_api_mock_group", "td_api_mock",
		"td_postgresql_connection_group", "td_postgresql_connection",
		"td_rdp_connection_group", "td_rdp_connection",
	}
	for _, table := range expectedTables {
		var count int
		err := db.QueryRow(
			"SELECT COUNT(1) FROM sqlite_master WHERE type='table' AND name = ?",
			table,
		).Scan(&count)
		if err != nil {
			t.Fatal(err)
		}
		if count != 1 {
			t.Errorf("thiếu bảng %s", table)
		}
	}

	// Mọi bảng detail đều phải có cột group_id
	detailTables := []string{
		"td_api_testing", "td_api_testing_pro_mode", "td_api_mock",
		"td_postgresql_connection", "td_rdp_connection",
	}
	for _, table := range detailTables {
		if !hasColumn(t, db, table, "group_id") {
			t.Errorf("bảng %s thiếu cột group_id", table)
		}
	}

	// Mọi bảng group đều phải có id + name
	groupTables := []string{
		"td_api_testing_group", "td_api_testing_pro_mode_group", "td_api_mock_group",
		"td_postgresql_connection_group", "td_rdp_connection_group",
	}
	for _, table := range groupTables {
		if !hasColumn(t, db, table, "id") {
			t.Errorf("bảng group %s thiếu cột id", table)
		}
		if !hasColumn(t, db, table, "name") {
			t.Errorf("bảng group %s thiếu cột name", table)
		}
	}
}

// hasColumn kiểm tra 1 bảng đã có cột đó chưa
func hasColumn(t *testing.T, db *sql.DB, table string, column string) bool {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var (
			cid        int
			name       string
			columnType string
			notNull    int
			defaultVal sql.NullString
			primaryKey int
		)
		if err := rows.Scan(&cid, &name, &columnType, &notNull, &defaultVal, &primaryKey); err != nil {
			t.Fatal(err)
		}
		if name == column {
			return true
		}
	}
	return false
}
