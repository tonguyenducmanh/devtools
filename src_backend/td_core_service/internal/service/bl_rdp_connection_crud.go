// file này chứa toàn bộ các method CRUD liên quan tới database của RDP connection

package service

import (
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// GetRDPConnectionController trả về controller quản lý RDP connection
func GetRDPConnectionController() *BaseCRUDController[model.TDRDPConnection] {
	return &BaseCRUDController[model.TDRDPConnection]{
		PathPrefix:   "rdp_connection",
		Repo:         database.BaseRepository[model.TDRDPConnection]{},
	}
}
