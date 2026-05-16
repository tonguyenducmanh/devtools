// file này chứa toàn bộ các method CURD liên quan tới database của mock api

package service

import (
	"errors"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"td_core_service/td_common"
)

// --- Hooks cho Mock API Item ---

func beforeInsertMockAPI(req *model.TDAPIMockItem, r *http.Request) error {
	if req.RequestName == "" || req.Endpoint == "" {
		return errors.New("request_name và end_point là bắt buộc")
	}
	req.ID = td_common.GenUUID()
	return nil
}

func beforeUpdateMockAPI(req *model.TDAPIMockItem, r *http.Request) error {
	if req.ID == "" {
		return errors.New("ID là bắt buộc")
	}
	return nil
}

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
		BeforeInsert: beforeInsertMockAPI,
		BeforeUpdate: beforeUpdateMockAPI,
		AfterInsert:  func(req *model.TDAPIMockItem, r *http.Request) { triggerRestartMockServer(req, r) },
		AfterUpdate:  func(req *model.TDAPIMockItem, r *http.Request) { triggerRestartMockServer(req, r) },
		AfterDelete:  triggerRestartMockServerOnDelete,
	}
}

// --- Hooks cho Mock API Group ---

func beforeInsertMockGroup(req *model.TDAPIMockGroup, r *http.Request) error {
	if req.Name == "" {
		return errors.New("Tên nhóm là bắt buộc")
	}
	req.ID = td_common.GenUUID()
	return nil
}

func customDeleteMockGroup(id string, r *http.Request) error {
	// Sử dụng logic delete custom của mock group (xóa cả items trong group)
	return database.DeleteMockGroup(id)
}

// GetMockGroupController trả về controller quản lý nhóm mock API
func GetMockGroupController() *BaseCRUDController[model.TDAPIMockGroup] {
	return &BaseCRUDController[model.TDAPIMockGroup]{
		PathPrefix:   "mock_group",
		Repo:         database.BaseRepository[model.TDAPIMockGroup]{},
		BeforeInsert: beforeInsertMockGroup,
		CustomDelete: customDeleteMockGroup,
		AfterDelete:  triggerRestartMockServerOnDelete,
	}
}
