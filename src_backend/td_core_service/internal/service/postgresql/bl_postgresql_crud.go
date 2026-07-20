// file này chứa toàn bộ các method CRUD liên quan tới PostgreSQL connection, group và saved query

package postgresql

import (
	"net/http"
	pgdb "td_core_service/internal/database/postgresql"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"td_core_service/internal/service"
)

// --- Hooks cho PostgreSQL Connection Group ---

func beforeDeletePostgreSQLGroup(id string, r *http.Request) error {
	// Xoá tất cả connection thuộc group trước khi xóa group
	pgdb.InvalidateAllPostgreSQLConnectionCache()
	return pgdb.DeletePostgreSQLConnectionsByGroupID(id)
}

// GetPostgreSQLConnectionGroupController trả về controller quản lý nhóm connection
func GetPostgreSQLConnectionGroupController() *service.TDBLBase[model.TDPostgreSQLConnectionGroup] {
	return &service.TDBLBase[model.TDPostgreSQLConnectionGroup]{
		PathPrefix:   "postgresql_connection_group",
		Repo:         database.TDDLBase[model.TDPostgreSQLConnectionGroup]{},
		BeforeDelete: beforeDeletePostgreSQLGroup,
	}
}

// --- Hooks cho PostgreSQL Connection ---

func afterInsertConnection(conn *model.TDPostgreSQLConnection, r *http.Request) {
	pgdb.InvalidatePostgreSQLConnectionCache(conn.ID)
}

func afterUpdateConnection(conn *model.TDPostgreSQLConnection, r *http.Request) {
	pgdb.InvalidatePostgreSQLConnectionCache(conn.ID)
}

func beforeDeleteConnection(id string, r *http.Request) error {
	pgdb.InvalidatePostgreSQLConnectionCache(id)
	return nil
}

// GetPostgreSQLConnectionController trả về controller quản lý connection
func GetPostgreSQLConnectionController() *service.TDBLBase[model.TDPostgreSQLConnection] {
	return &service.TDBLBase[model.TDPostgreSQLConnection]{
		PathPrefix:  "postgresql_connection",
		Repo:        database.TDDLBase[model.TDPostgreSQLConnection]{},
		AfterInsert: afterInsertConnection,
		AfterUpdate: afterUpdateConnection,
		BeforeDelete: beforeDeleteConnection,
	}
}

// --- Custom Create cho PostgreSQL Saved Query (ghi bất đồng bộ qua buffer) ---

func savedQueryCustomCreate(req *model.TDPostgreSQLSavedQuery, r *http.Request) error {
	pgdb.PushPostgreSQLSavedQuery(req)
	return nil
}

// GetPostgreSQLSavedQueryController trả về controller quản lý saved query
func GetPostgreSQLSavedQueryController() *service.TDBLBase[model.TDPostgreSQLSavedQuery] {
	return &service.TDBLBase[model.TDPostgreSQLSavedQuery]{
		PathPrefix:   "postgresql_saved_query",
		Repo:         database.TDDLBase[model.TDPostgreSQLSavedQuery]{},
		CustomCreate: savedQueryCustomCreate,
	}
}
