// file này chứa toàn bộ các logic service về việc xử lý dữ liệu
// khi nhận được request tới server mock cần tìm ra body, header, endpoint tương ứng

package service

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"td_config"
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
	mocks, err := (&database.BaseRepository[model.TDAPIMockItem]{}).GetAll()
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
		if !td_config.GetConfigGlobal().EndpointCaseSensitive {
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
		BuildNotFoundResponse(w, r, nil)
	})
}

// xử lý nghiệp vụ khi không tìm được mock phù hợp
func BuildNotFoundResponse(w http.ResponseWriter, r *http.Request, messageNotFound *string) {
	not_found_log := "404 Not Found - API endpoint mock không tồn tại"
	if messageNotFound != nil {
		not_found_log = *messageNotFound
	}
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
		selectedMock, notFoundBody := findMatchingMockBodyGroupByEndpoint(mocks, bodyBytes)

		// không tìm thấy mock phù hợp thì trả về not found
		if notFoundBody == true {
			notFoundMess := "404 Not Found - API endpoint mock có tồn tại nhưng không tìm được body mock tương ứng"
			BuildNotFoundResponse(w, r, &notFoundMess)
		} else {
			// trả về mock phù hợp
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(selectedMock.ResponeText))
		}

	}

	mux.HandleFunc(pattern, handler)
	td_common.LogInfo(fmt.Sprintf("Đã đăng ký mock API: %s với %d biến thể", pattern, len(mocks)))
}

// Tìm mock phù hợp dựa trên request body, các body này có chung endpoint api
func findMatchingMockBodyGroupByEndpoint(mocks []model.TDAPIMockItem, BodyText []byte) (*model.TDAPIMockItem, bool) {
	BodyTextStr := string(BodyText)

	// Trường hợp 1: Tìm mock có BodyText khớp chính xác (so sánh JSON)
	for i := range mocks {
		if mocks[i].BodyText != "" {
			if td_common.JSONEquivalent(mocks[i].BodyText, BodyTextStr) {
				td_common.LogInfo(fmt.Sprintf("Đã tìm được body tương ứng với mock: %s - endpoint: %s", mocks[i].RequestName, mocks[i].Endpoint))
				return &mocks[i], false
			}
		}
	}
	if td_config.GetConfigGlobal().MockAPIConfig.EnableMockNotCareBody {
		// Trường hợp 2: Tìm mock có BodyText trống hoặc null (dùng làm default)
		for i := range mocks {
			if mocks[i].BodyText == "" || mocks[i].BodyText == "null" {
				td_common.LogInfo(fmt.Sprintf("Đã sử dụng default mock: %s - endpoint: %s", mocks[i].RequestName, mocks[i].Endpoint))
				return &mocks[i], false
			}
		}

		// Trường hợp 3: Nếu không tìm thấy, dùng mock đầu tiên
		td_common.LogInfo(fmt.Sprintf("Không tìm được body tương ứng, dùng mock đầu tiên: %s  - endpoint: %s", mocks[0].RequestName, mocks[0].Endpoint))
		return &mocks[0], false
	} else {
		// trả về là không tìm thấy mock tương ứng
		return nil, true
	}
}

// lấy ra base url của mock server
func GetMockServerBaseUrl(w http.ResponseWriter, r *http.Request) {
	port := td_config.GetConfigGlobal().MockAPIConfig.Port
	addr := fmt.Sprintf("%d", port)
	server := td_common.GetServerIP()
	base_url := fmt.Sprintf("http://%s:%s", server, addr)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    base_url,
	})
}
