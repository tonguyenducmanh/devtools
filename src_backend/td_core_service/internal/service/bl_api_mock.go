package service

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"time"
)

var (
	mockServer      *http.Server
	mockServerMutex sync.Mutex
	mockPort        int
)

/**
 * Khởi tạo mock API service với port riêng
 */
func InitMockAPIService(port int) {
	mockPort = port
	RestartMockServer()
}

/**
 * Khởi động lại server mock API
 */
func RestartMockServer() {
	mockServerMutex.Lock()
	defer mockServerMutex.Unlock()

	// Tắt server cũ nếu đang chạy
	if mockServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		mockServer.Shutdown(ctx)
		fmt.Printf("Đã dừng Mock API Server tại port %d để cập nhật cấu hình\n", mockPort)
	}

	// Tạo mux mới và đăng ký lại tất cả routes từ database
	mux := http.NewServeMux()
	mocks, err := database.GetAllMockAPIsForAutoStart()
	if err != nil {
		fmt.Printf("Lỗi query mock APIs: %v\n", err)
	} else {
		// Nhóm các mock theo endpoint và method
		mocksByRoute := groupMocksByRoute(mocks)
		for routeKey, routeMocks := range mocksByRoute {
			registerMockRouteOnMux(mux, routeKey, routeMocks)
		}
	}

	// Tạo server mới
	mockServer = &http.Server{
		Addr:    fmt.Sprintf(":%d", mockPort),
		Handler: mux,
	}

	// Chạy server trong goroutine
	go func() {
		fmt.Printf("Mock API Server đang chạy tại http://localhost:%d\n", mockPort)
		if err := mockServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Lỗi Mock API Server: %v\n", err)
		}
	}()
}

/**
 * Nhóm các mock theo endpoint và method
 */
func groupMocksByRoute(mocks []model.TDAPIMockItem) map[string][]model.TDAPIMockItem {
	mocksByRoute := make(map[string][]model.TDAPIMockItem)

	for i := range mocks {
		endpoint := mocks[i].Endpoint
		if !strings.HasPrefix(endpoint, "/") {
			endpoint = "/" + endpoint
		}
		routeKey := fmt.Sprintf("%s %s", mocks[i].Method, endpoint)
		mocksByRoute[routeKey] = append(mocksByRoute[routeKey], mocks[i])
	}

	return mocksByRoute
}

/**
 * Đăng ký route vào mux cụ thể với hỗ trợ nhiều response theo body
 */
func registerMockRouteOnMux(mux *http.ServeMux, pattern string, mocks []model.TDAPIMockItem) {
	handler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		// Thêm CORS cho mock API
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

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
	fmt.Printf("Đã đăng ký mock API: %s với %d variants\n", pattern, len(mocks))
}

/**
 * Tìm mock phù hợp dựa trên request body
 */
func findMatchingMock(mocks []model.TDAPIMockItem, BodyText []byte) *model.TDAPIMockItem {
	BodyTextStr := string(BodyText)

	// Trường hợp 1: Tìm mock có BodyText khớp chính xác (so sánh JSON)
	for i := range mocks {
		if mocks[i].BodyText != "" {
			if jsonEqual(mocks[i].BodyText, BodyTextStr) {
				fmt.Printf("✓ Matched exact body for mock: %s\n", mocks[i].RequestName)
				return &mocks[i]
			}
		}
	}

	// Trường hợp 2: Tìm mock có BodyText trống hoặc null (dùng làm default)
	for i := range mocks {
		if mocks[i].BodyText == "" || mocks[i].BodyText == "null" {
			fmt.Printf("✓ Using default mock: %s\n", mocks[i].RequestName)
			return &mocks[i]
		}
	}

	// Trường hợp 3: Nếu không tìm thấy, dùng mock đầu tiên
	fmt.Printf("⚠ No matching body found, using first mock: %s\n", mocks[0].RequestName)
	return &mocks[0]
}

/**
 * So sánh 2 JSON string có bằng nhau không (bỏ qua thứ tự key)
 */
func jsonEqual(json1, json2 string) bool {
	// Nếu cả 2 đều rỗng
	if strings.TrimSpace(json1) == "" && strings.TrimSpace(json2) == "" {
		return true
	}

	// Parse JSON
	var obj1, obj2 interface{}

	if err := json.Unmarshal([]byte(json1), &obj1); err != nil {
		// Nếu không phải JSON, so sánh string thông thường
		return strings.TrimSpace(json1) == strings.TrimSpace(json2)
	}

	if err := json.Unmarshal([]byte(json2), &obj2); err != nil {
		return false
	}

	// So sánh bằng cách serialize lại (chuẩn hóa)
	bytes1, _ := json.Marshal(obj1)
	bytes2, _ := json.Marshal(obj2)

	return string(bytes1) == string(bytes2)
}

/**
 * Hash body để so sánh nhanh (dự phòng)
 */
func hashBody(body string) string {
	hash := md5.Sum([]byte(strings.TrimSpace(body)))
	return fmt.Sprintf("%x", hash)
}

/**
 * thực hiện tạo api mock
 */
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

	req.ID = GenUUID()

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

/**
 * thực hiện lấy danh sách mock api
 */
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

/**
 * thực hiện cập nhật api mock
 */
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

/**
 * thực hiện xóa api mock
 */
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

/**
 * thực hiện lấy danh sách nhóm mock api
 */
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

/**
 * thực hiện tạo nhóm mock api mới
 */
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

	req.ID = GenUUID()

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

/**
 * thực hiện xóa nhóm mock api
 */
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
