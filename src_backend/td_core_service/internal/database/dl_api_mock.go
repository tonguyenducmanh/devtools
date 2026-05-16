package database

import (
	"td_core_service/internal/model"
)

// Xóa các mock item thuộc nhóm đó
func DeleteMockItemsByGroupID(groupID string) error {
	repoItems := BaseRepository[model.TDAPIMockItem]{}
	_, err := repoItems.ExecRaw("DELETE FROM td_api_mock WHERE group_id = ?", groupID)
	return err
}
