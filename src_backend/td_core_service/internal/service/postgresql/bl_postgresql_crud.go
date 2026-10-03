// file này chứa toàn bộ các method CRUD liên quan tới PostgreSQL connection và group

package postgresql

import (
	"net/http"
	"td_core_service/internal/model"
	"td_core_service/internal/service"

	pgdb "td_core_service/internal/database/postgresql"
)

// --- Hooks cho PostgreSQL Connection ---
//
// Connection được cache trong memory (tầng database/postgresql) để khỏi đọc
// SQLite mỗi lần execute query, nên mọi thay đổi connection đều phải invalidate cache.

// invalidateConnectionCacheAfterChange hook sau khi thêm hoặc sửa 1 connection
func invalidateConnectionCacheAfterChange(conn *model.TDPostgreSQLConnection, _ *http.Request) {
	pgdb.InvalidatePostgreSQLConnectionCache(conn.ID)
}

// invalidateConnectionCacheBeforeDelete hook trước khi xoá 1 connection
func invalidateConnectionCacheBeforeDelete(id string, _ *http.Request) error {
	pgdb.InvalidatePostgreSQLConnectionCache(id)
	return nil
}

// invalidateAllConnectionCacheBeforeDeleteGroup xoá group sẽ xoá luôn mọi connection
// thuộc group nên phải invalidate toàn bộ cache, không chỉ 1 id.
func invalidateAllConnectionCacheBeforeDeleteGroup(_ string, _ *http.Request) error {
	pgdb.InvalidateAllPostgreSQLConnectionCache()
	return nil
}

// GetPostgreSQLConnectionCollection trả về cặp master-detail của PostgreSQL connection:
// bảng master là td_postgresql_connection_group, bảng detail là td_postgresql_connection.
//
// Cascade delete và endpoint get_tree đã có sẵn trong TDCollection,
// ở đây chỉ gắn thêm hook quản lý connection cache.
func GetPostgreSQLConnectionCollection() *service.TDCollection[model.TDPostgreSQLConnectionGroup, model.TDPostgreSQLConnection] {
	collection := service.NewCollection[model.TDPostgreSQLConnectionGroup, model.TDPostgreSQLConnection](
		"postgresql_connection_group",
		"postgresql_connection",
	)
	collection.Item.AfterInsert = invalidateConnectionCacheAfterChange
	collection.Item.AfterUpdate = invalidateConnectionCacheAfterChange
	collection.Item.BeforeDelete = invalidateConnectionCacheBeforeDelete
	collection.SetGroupBeforeDelete(invalidateAllConnectionCacheBeforeDeleteGroup)
	return collection
}
