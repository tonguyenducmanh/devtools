package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	configGlobal "td_core_service/external/config"
	"td_core_service/internal/database"
	"td_core_service/internal/middleware"
	"td_core_service/internal/model"
	"td_core_service/td_common"
	"time"
)

var (
	mockServer      *http.Server
	mockServerMutex sync.Mutex
	mockPort        int
)

// Khởi tạo mock API service với port riêng
func InitMockAPIService(port int) {
	mockPort = port
	RestartMockServer()
}

// Khởi động lại mock server từ phía client
func RestartMockServerFromClient(w http.ResponseWriter, r *http.Request) {
	RestartMockServer()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Khởi động lại mock server từ phía client thành công",
	})
}

// Khởi động lại server mock API
func RestartMockServer() {
	mockServerMutex.Lock()
	defer mockServerMutex.Unlock()

	// Tắt server cũ nếu đang chạy
	if mockServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		mockServer.Shutdown(ctx)
		td_common.LogInfo("Đã dừng Mock API Server để cập nhật cấu hình")
	}

	// Tạo app mới và đăng ký lại tất cả routes từ database
	app := http.NewServeMux()

	// gán 1 số route default
	registerDefaultRouteOnMux(app)

	// gán 1 số route theo thiết lập từ phía client
	mocks, err := database.GetAllMockAPIsForAutoStart()
	if err != nil {
		td_common.LogInfo(fmt.Sprintf("Lỗi query mock APIs: %v", err))
	} else {
		// Nhóm các mock theo endpoint và method
		mocksByRoute := groupMocksByRoute(mocks)
		for routeKey, routeMocks := range mocksByRoute {
			registerMockRouteOnMux(app, routeKey, routeMocks)
		}
	}

	// inject 1 số kịch bản chung toàn chương tình vào handler
	var handler = td_common.BuildHanlderAPICommon(app)

	// Tạo server mới
	mockServer = &http.Server{
		Addr:    fmt.Sprintf(":%d", mockPort),
		Handler: handler,
	}

	// Chạy server trong goroutine
	go func() {
		td_common.BuildRunningAddressServer("Server Mock API", &mockPort)
		if err := mockServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			td_common.LogInfo(fmt.Sprintf("Lỗi Mock API Server: %v", err))
		}
	}()
}

// Nhóm các mock theo endpoint và method
func groupMocksByRoute(mocks []model.TDAPIMockItem) map[string][]model.TDAPIMockItem {
	mocksByRoute := make(map[string][]model.TDAPIMockItem)

	for i := range mocks {
		endpoint := mocks[i].Endpoint
		// cấu hình endpoint có phân biệt hoa thường hay không
		if !configGlobal.GetConfigGlobal().EndpointCaseSensitive {
			endpoint = strings.ToLower(endpoint)
		}
		if !strings.HasPrefix(endpoint, "/") {
			endpoint = "/" + endpoint
		}
		routeKey := fmt.Sprintf("%s %s", mocks[i].Method, endpoint)
		mocksByRoute[routeKey] = append(mocksByRoute[routeKey], mocks[i])
	}

	return mocksByRoute
}

// Đăng ký route vào mux 1 số route default
func registerDefaultRouteOnMux(mux *http.ServeMux) {
	// route không tồn tại thì trả về not found specific
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		not_found_log := "404 Not Found API endpoint mock không tồn tại"
		// Log lại để biết có request truy cập vào route lạ
		td_common.LogInfo(fmt.Sprintf("%s: %s %s", not_found_log, r.Method, r.URL.Path))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": not_found_log,
			"path":    r.URL.Path,
			"method":  r.Method,
		})
	})
}

// Đăng ký route vào mux cụ thể với hỗ trợ nhiều response theo body
func registerMockRouteOnMux(mux *http.ServeMux, pattern string, mocks []model.TDAPIMockItem) {
	handler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		// Thêm CORS cho mock API
		middleware.BypassCORSConfig(w)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Đọc body của request
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Lỗi đọc request body", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Tìm mock phù hợp dựa trên body
		selectedMock := findMatchingMock(mocks, bodyBytes)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(selectedMock.ResponeText))
	}

	mux.HandleFunc(pattern, handler)
	td_common.LogInfo(fmt.Sprintf("Đã đăng ký mock API: %s với %d biến thể", pattern, len(mocks)))
}

// Tìm mock phù hợp dựa trên request body
func findMatchingMock(mocks []model.TDAPIMockItem, BodyText []byte) *model.TDAPIMockItem {
	BodyTextStr := string(BodyText)

	// Trường hợp 1: Tìm mock có BodyText khớp chính xác (so sánh JSON)
	for i := range mocks {
		if mocks[i].BodyText != "" {
			if td_common.JSONEquivalent(mocks[i].BodyText, BodyTextStr) {
				td_common.LogInfo(fmt.Sprintf("Đã tìm được body tương ứng với mock: %s", mocks[i].RequestName))
				return &mocks[i]
			}
		}
	}

	// Trường hợp 2: Tìm mock có BodyText trống hoặc null (dùng làm default)
	for i := range mocks {
		if mocks[i].BodyText == "" || mocks[i].BodyText == "null" {
			td_common.LogInfo(fmt.Sprintf("Đã sử dụng default mock: %s", mocks[i].RequestName))
			return &mocks[i]
		}
	}

	// Trường hợp 3: Nếu không tìm thấy, dùng mock đầu tiên
	td_common.LogInfo(fmt.Sprintf("Không tìm được body tương ứng, dùng mock đầu tiên: %s", mocks[0].RequestName))
	return &mocks[0]
}

// thực hiện tạo api mock
func CreateMockAPI(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPIMockItem

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.RequestName == "" || req.Endpoint == "" {
		http.Error(w, "request_name và end_point là bắt buộc", http.StatusBadRequest)
		return
	}

	req.ID = td_common.GenUUID()

	err := database.CreateMockAPI(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi lưu mock API: %v", err), http.StatusInternalServerError)
		return
	}

	// Restart server để áp dụng thay đổi
	go RestartMockServer()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Tạo mock API thành công và đang khởi động lại server mock",
		"data":    req,
	})
}

// thực hiện lấy danh sách mock api
func GetAllMockAPI(w http.ResponseWriter, r *http.Request) {
	mocks, err := database.GetAllMockAPIs()
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    mocks,
	})
}

// thực hiện cập nhật api mock
func UpdateMockAPI(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPIMockItem

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.ID == "" {
		http.Error(w, "ID là bắt buộc", http.StatusBadRequest)
		return
	}

	rowsAffected, err := database.UpdateMockAPI(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi cập nhật: %v", err), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Không tìm thấy mock API", http.StatusNotFound)
		return
	}

	// Restart server để áp dụng thay đổi
	go RestartMockServer()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Cập nhật mock API thành công và đang khởi động lại server mock",
	})
}

// thực hiện xóa api mock
func RemoveMockAPI(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID là bắt buộc", http.StatusBadRequest)
		return
	}

	rowsAffected, err := database.DeleteMockAPI(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi xóa: %v", err), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Không tìm thấy mock API", http.StatusNotFound)
		return
	}

	// Restart server để áp dụng thay đổi
	go RestartMockServer()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Xóa mock API thành công và đang khởi động lại server mock",
	})
}

// thực hiện lấy danh sách nhóm mock api
func GetAllMockGroup(w http.ResponseWriter, r *http.Request) {
	groups, err := database.GetAllMockGroups()
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query nhóm: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    groups,
	})
}

// thực hiện tạo nhóm mock api mới
func CreateMockGroup(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPIMockGroup

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Tên nhóm là bắt buộc", http.StatusBadRequest)
		return
	}

	req.ID = td_common.GenUUID()

	err := database.CreateMockGroup(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi lưu nhóm: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Tạo nhóm mock API thành công",
		"data":    req,
	})
}

// thực hiện xóa nhóm mock api
func RemoveMockGroup(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID nhóm là bắt buộc", http.StatusBadRequest)
		return
	}

	err := database.DeleteMockGroup(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi xóa nhóm: %v", err), http.StatusInternalServerError)
		return
	}

	// Restart server mock vì các mock api trong nhóm đã bị xóa (cascade)
	go RestartMockServer()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Xóa nhóm và các mock API thành công",
	})
}
