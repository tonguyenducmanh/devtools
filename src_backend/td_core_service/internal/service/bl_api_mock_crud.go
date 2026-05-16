// file này chứa toàn bộ các method CURD liên quan tới database của mock api

package service

import (
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// --- Hooks cho Mock API Item ---

func triggerRestartMockServer(item interface{}, r *http.Request) {
	go RestartMockServer()
}

func triggerRestartMockServerOnDelete(id string, r *http.Request) {
	go RestartMockServer()
}

// GetMockAPIController trả về controller quản lý mock API
func GetMockAPIController() *BaseCRUDController[model.TDAPIMockItem] {
	return &BaseCRUDController[model.TDAPIMockItem]{
		PathPrefix:   "mock_api",
		Repo:         database.BaseRepository[model.TDAPIMockItem]{},
		AfterInsert:  func(req *model.TDAPIMockItem, r *http.Request) { triggerRestartMockServer(req, r) },
		AfterUpdate:  func(req *model.TDAPIMockItem, r *http.Request) { triggerRestartMockServer(req, r) },
		AfterDelete:  triggerRestartMockServerOnDelete,
	}
}

// --- Hooks cho Mock API Group ---

func customDeleteMockGroup(id string, r *http.Request) error {
	// Sử dụng logic delete custom của mock group (xóa cả items trong group)
	return database.DeleteMockGroup(id)
}

// GetMockGroupController trả về controller quản lý nhóm mock API
func GetMockGroupController() *BaseCRUDController[model.TDAPIMockGroup] {
	return &BaseCRUDController[model.TDAPIMockGroup]{
		PathPrefix:   "mock_group",
		Repo:         database.BaseRepository[model.TDAPIMockGroup]{},
		CustomDelete: customDeleteMockGroup,
		AfterDelete:  triggerRestartMockServerOnDelete,
	}
}
