// file này chứa toàn bộ các method CRUD liên quan tới database của RDP connection

package service

import (
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// GetRDPConnectionController trả về controller quản lý RDP connection
func GetRDPConnectionController() *TDBLBase[model.TDRDPConnection] {
	return &TDBLBase[model.TDRDPConnection]{
		PathPrefix: "rdp_connection",
		Repo:       database.TDDLBase[model.TDRDPConnection]{},
	}
}
