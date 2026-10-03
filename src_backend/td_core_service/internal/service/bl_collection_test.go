package service

import (
	"net/http"
	"testing"

	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// assertCollectionRoutes kiểm tra 1 cặp master-detail đăng ký đúng PathPrefix
// và đủ route cho cả group lẫn item.
func assertCollectionRoutes[TGroup database.TDGroup, TItem database.TDGroupedItem](
	t *testing.T,
	collection *TDCollection[TGroup, TItem],
	groupPath string,
	itemPath string,
) {
	t.Helper()

	// PathPrefix phải đúng ngay từ lúc khởi tạo
	if got := collection.Group.PathPrefix; got != groupPath {
		t.Errorf("Group.PathPrefix = %q, want %q", got, groupPath)
	}
	if got := collection.Item.PathPrefix; got != itemPath {
		t.Errorf("Item.PathPrefix = %q, want %q", got, itemPath)
	}

	// Đăng ký route sẽ panic nếu pattern không hợp lệ
	app := http.NewServeMux()
	collection.RegisterRoutes(app)

	expectedRoutes := []struct {
		method string
		path   string
	}{
		{"GET", "/" + groupPath + "/get_all"},
		{"POST", "/" + groupPath + "/create"},
		{"PUT", "/" + groupPath + "/update"},
		{"DELETE", "/" + groupPath + "/delete_by_id"},
		{"GET", "/" + itemPath + "/get_all"},
		{"POST", "/" + itemPath + "/create"},
		{"PUT", "/" + itemPath + "/update"},
		{"DELETE", "/" + itemPath + "/delete_by_id"},
		{"GET", "/" + itemPath + "/get_tree"},
	}

	for _, route := range expectedRoutes {
		request, err := http.NewRequest(route.method, route.path, nil)
		if err != nil {
			t.Fatal(err)
		}
		// pattern rỗng nghĩa là ServeMux không tìm thấy route nào khớp
		_, pattern := app.Handler(request)
		if pattern == "" {
			t.Errorf("không tìm thấy route %s %s", route.method, route.path)
		}
	}
}

// TestCollectionRegisterRoutes đảm bảo mọi cặp master-detail đều đăng ký route đúng.
//
// Quan trọng: http.ServeMux panic lúc chạy nếu pattern sai (vd: PathPrefix rỗng
// sinh ra "GET //get_all" — "non-CONNECT pattern with unclean path").
// Test này bắt được lỗi đó lúc chạy test thay vì lúc khởi động app.
func TestCollectionRegisterRoutes(t *testing.T) {
	t.Run("mock api", func(t *testing.T) {
		assertCollectionRoutes(t, GetMockAPICollection(), "mock_group", "mock_api")
	})

	t.Run("api testing", func(t *testing.T) {
		assertCollectionRoutes(t, GetTestingAPICollection(), "api_testing_group", "api_testing")
	})

	t.Run("api testing pro mode", func(t *testing.T) {
		assertCollectionRoutes(
			t,
			GetTestingProModeAPICollection(),
			"api_testing_pro_mode_group",
			"api_testing_pro_mode",
		)
	})

	t.Run("rdp connection", func(t *testing.T) {
		assertCollectionRoutes(
			t,
			GetRDPConnectionCollection(),
			"rdp_connection_group",
			"rdp_connection",
		)
	})
}

// Cascade delete phải được ghép vào hook của tool, không bị tool ghi đè mất
func TestCollectionKeepsCascadeAlongsideToolHook(t *testing.T) {
	collection := GetMockAPICollection()
	controller := collection.groupController()

	if controller.BeforeDelete == nil {
		t.Error("BeforeDelete phải được gắn cascade delete")
	}
	if controller.CustomDelete == nil {
		t.Error("CustomDelete phải được gắn cascade delete item + group")
	}
	// AfterDelete của tool (restart mock server) phải còn nguyên
	if controller.AfterDelete == nil {
		t.Error("AfterDelete hook của tool bị mất khi ghép cascade")
	}
}

// Đảm bảo các model thực tế của app thoả ràng buộc TDGroup / TDGroupedItem,
// tức là group bắt buộc có id + name và item bắt buộc có group_id.
// Nếu thiếu, phải fail ngay lúc biên dịch chứ không phải lúc chạy.
func TestModelsSatisfyCollectionConstraints(t *testing.T) {
	// biên dịch là đã đủ để chứng minh các model thoả ràng buộc generic
	var (
		_ TDCollection[model.TDAPIMockGroup, model.TDAPIMockItem]
		_ TDCollection[model.TDAPITestingGroup, model.TDAPITestingItem]
		_ TDCollection[model.TDAPITestingProModeGroup, model.TDAPITestingProModeItem]
		_ TDCollection[model.TDRDPConnectionGroup, model.TDRDPConnection]
	)
}
