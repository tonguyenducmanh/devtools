package model

// model cho database RDP connection group.
// Dùng chung TMGroupModel với các bảng group khác (id, name, created_date, modified_date)
type TMRDPConnectionGroup struct {
	TMGroupModel
}

func (g TMRDPConnectionGroup) TableName() string {
	return "tm_rdp_connection_group"
}

// model cho RDP connection
type TMRDPConnection struct {
	TMBaseModel
	ConnectionName string `json:"connection_name"`
	// GroupID là id của nhóm chứa connection này.
	// Rỗng nghĩa là connection chưa được gán vào nhóm nào, frontend hiển thị ở nhóm "Ungrouped".
	GroupID  string `json:"group_id"`
	Host     string `json:"host"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func (m TMRDPConnection) TableName() string {
	return "tm_rdp_connection"
}

// GetGroupID trả về id của nhóm chứa connection này, rỗng nghĩa là chưa gán nhóm
func (m TMRDPConnection) GetGroupID() string {
	return m.GroupID
}