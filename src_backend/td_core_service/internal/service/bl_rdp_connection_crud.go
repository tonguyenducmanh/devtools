// file này chứa toàn bộ các method CRUD liên quan tới database của RDP connection

package service

import (
	"errors"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"td_core_service/td_common"
)

// --- Hooks cho RDP Connection ---

func beforeInsertRDPConnection(req *model.TDRDPConnection, r *http.Request) error {
	if req.ConnectionName == "" || req.Host == "" {
		return errors.New("connection_name và host là bắt buộc")
	}
	req.ID = td_common.GenUUID()
	return nil
}

func beforeUpdateRDPConnection(req *model.TDRDPConnection, r *http.Request) error {
	if req.ID == "" {
		return errors.New("ID là bắt buộc")
	}
	return nil
}

// GetRDPConnectionController trả về controller quản lý RDP connection
func GetRDPConnectionController() *BaseCRUDController[model.TDRDPConnection] {
	return &BaseCRUDController[model.TDRDPConnection]{
		PathPrefix:   "rdp_connection",
		Repo:         database.BaseRepository[model.TDRDPConnection]{},
		BeforeInsert: beforeInsertRDPConnection,
		BeforeUpdate: beforeUpdateRDPConnection,
	}
}
