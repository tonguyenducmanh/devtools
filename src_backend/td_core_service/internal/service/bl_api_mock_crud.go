// file này chứa toàn bộ các method CURD liên quan tới database của mock api

package service

import (
	"net/http"
	"td_core_service/internal/model"
)

// --- Hooks cho Mock API ---
//
// Mock server đăng ký route lúc start nên không hot-reload được:
// mọi thay đổi mock (thêm / sửa / xoá) đều phải restart server để nạp lại route.

// restartMockServerAfterMockChange hook sau khi thêm hoặc sửa 1 mock
func restartMockServerAfterMockChange(_ *model.TDAPIMockItem, _ *http.Request) {
	go RestartMockServer()
}

// restartMockServerAfterMockDelete hook sau khi xoá 1 mock hoặc 1 nhóm mock
func restartMockServerAfterMockDelete(_ string, _ *http.Request) {
	go RestartMockServer()
}

// GetMockAPICollection trả về cặp master-detail của mock API:
// bảng master là td_api_mock_group, bảng detail là td_api_mock.
//
// Cascade delete và endpoint get_tree đã có sẵn trong TDCollection,
// ở đây chỉ gắn thêm hook restart mock server.
func GetMockAPICollection() *TDCollection[model.TDAPIMockGroup, model.TDAPIMockItem] {
	collection := NewCollection[model.TDAPIMockGroup, model.TDAPIMockItem](
		"mock_group",
		"mock_api",
	)
	collection.Item.AfterInsert = restartMockServerAfterMockChange
	collection.Item.AfterUpdate = restartMockServerAfterMockChange
	collection.Item.AfterDelete = restartMockServerAfterMockDelete
	collection.SetGroupAfterDelete(restartMockServerAfterMockDelete)
	return collection
}
