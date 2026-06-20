// file này chứa toàn bộ các method CRUD liên quan tới PostgreSQL connection, group và saved query

package service

import (
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// --- Hooks cho PostgreSQL Connection Group ---

func beforeDeletePostgreSQLGroup(id string, r *http.Request) error {
	// Xóa tất cả connection thuộc group trước khi xóa group
	return database.DeletePostgreSQLConnectionsByGroupID(id)
}

// GetPostgreSQLConnectionGroupController trả về controller quản lý nhóm connection
func GetPostgreSQLConnectionGroupController() *TDBLBase[model.TDPostgreSQLConnectionGroup] {
	return &TDBLBase[model.TDPostgreSQLConnectionGroup]{
		PathPrefix:   "postgresql_connection_group",
		Repo:         database.TDDLBase[model.TDPostgreSQLConnectionGroup]{},
		BeforeDelete: beforeDeletePostgreSQLGroup,
	}
}

// GetPostgreSQLConnectionController trả về controller quản lý connection
func GetPostgreSQLConnectionController() *TDBLBase[model.TDPostgreSQLConnection] {
	return &TDBLBase[model.TDPostgreSQLConnection]{
		PathPrefix: "postgresql_connection",
		Repo:       database.TDDLBase[model.TDPostgreSQLConnection]{},
	}
}

// GetPostgreSQLSavedQueryController trả về controller quản lý saved query
func GetPostgreSQLSavedQueryController() *TDBLBase[model.TDPostgreSQLSavedQuery] {
	return &TDBLBase[model.TDPostgreSQLSavedQuery]{
		PathPrefix: "postgresql_saved_query",
		Repo:       database.TDDLBase[model.TDPostgreSQLSavedQuery]{},
	}
}
