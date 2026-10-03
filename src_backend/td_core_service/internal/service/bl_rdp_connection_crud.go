// file này chứa toàn bộ các method CRUD liên quan tới database của RDP connection

package service

import (
	"td_core_service/internal/model"
)

// GetRDPConnectionCollection trả về cặp master-detail của RDP connection:
// bảng master là td_rdp_connection_group, bảng detail là td_rdp_connection.
//
// Nhờ dùng chung TDCollection mà RDP có đủ bộ tính năng giống các tool khác:
// cascade delete (xoá group sẽ xoá luôn connection trong group) và endpoint
// get_tree trả về cây group + connection đã gom sẵn.
func GetRDPConnectionCollection() *TDCollection[model.TDRDPConnectionGroup, model.TDRDPConnection] {
	return NewCollection[model.TDRDPConnectionGroup, model.TDRDPConnection](
		"rdp_connection_group",
		"rdp_connection",
	)
}
