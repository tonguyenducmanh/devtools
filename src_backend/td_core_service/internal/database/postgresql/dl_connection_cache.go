package postgresql

import (
	"fmt"
	"sync"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// Cache connection string trong memory, tránh đọc SQLite mỗi lần executeQuery
var (
	connCache sync.Map
)

// GetCachedPostgreSQLConnection lấy connection object từ cache (nếu có),
// nếu cache miss thì đọc từ SQLite rồi lưu vào cache.
func GetCachedPostgreSQLConnection(id string) (*model.TDPostgreSQLConnection, error) {
	if cached, ok := connCache.Load(id); ok {
		return cached.(*model.TDPostgreSQLConnection), nil
	}
	repo := database.TDDLBase[model.TDPostgreSQLConnection]{}
	conn, err := repo.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("lỗi đọc connection %s: %w", id, err)
	}
	if conn == nil {
		return nil, fmt.Errorf("không tìm thấy connection: %s", id)
	}
	connCache.Store(id, conn)
	return conn, nil
}

// InvalidatePostgreSQLConnectionCache xoá cache của 1 connection (gọi khi connection bị sửa/xoá)
func InvalidatePostgreSQLConnectionCache(id string) {
	connCache.Delete(id)
}

// InvalidateAllPostgreSQLConnectionCache xoá toàn bộ cache (dùng khi cần reset)
func InvalidateAllPostgreSQLConnectionCache() {
	connCache.Range(func(k, v any) bool {
		connCache.Delete(k)
		return true
	})
}
