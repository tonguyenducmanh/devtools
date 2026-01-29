package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"td_core_service/internal/database"
	"td_core_service/internal/model"

	"github.com/google/uuid"
)

// Map lưu trữ các handler động cho mock API
var mockHandlers = make(map[string]http.HandlerFunc)
var mockHandlersMutex sync.RWMutex

// Biến lưu trữ mux chính để có thể đăng ký route động
var mainMux *http.ServeMux

/**
 * Khởi tạo mock API service với mux
 */
func InitMockAPIService(mux *http.ServeMux) {
	mainMux = mux
	// Tự động load và start tất cả mock API khi khởi động
	AutoStartAllMockAPIs()
}

/**
 * Tự động start tất cả mock API từ database
 */
func AutoStartAllMockAPIs() {
	mocks, err := database.GetAllMockAPIsForAutoStart()
	if err != nil {
		fmt.Printf("Lỗi query mock APIs: %v\n", err)
		return
	}

	count := 0
	for i := range mocks {
		// Đăng ký route cho mock API
		registerMockRoute(&mocks[i])
		count++
	}

	fmt.Printf("Đã tự động start %d mock APIs\n", count)
}

/**
 * Đăng ký route động cho mock API
 */
func registerMockRoute(mock *model.TDAPIMockParam) {
	if mainMux == nil {
		return
	}

	pattern := fmt.Sprintf("%s %s", mock.Method, mock.Endpoint)

	// Tạo handler cho mock API
	handler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(mock.ResponeText))
	}

	// Lưu handler vào map
	mockHandlersMutex.Lock()
	mockHandlers[mock.ID] = handler
	mockHandlersMutex.Unlock()

	// Đăng ký route
	mainMux.HandleFunc(pattern, handler)
	fmt.Printf("Đã đăng ký mock API: %s %s\n", mock.Method, mock.Endpoint)
}

/**
 * Hủy đăng ký route (lưu ý: http.ServeMux không hỗ trợ xóa route, cần restart server)
 */
func unregisterMockRoute(mockID string) {
	mockHandlersMutex.Lock()
	delete(mockHandlers, mockID)
	mockHandlersMutex.Unlock()
}

/**
 * thực hiện tạo api mock
 */
func CreateMockAPI(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPIMockParam

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	// Validate dữ liệu
	if req.RequestName == "" || req.Endpoint == "" {
		http.Error(w, "request_name và end_point là bắt buộc", http.StatusBadRequest)
		return
	}

	// Tạo ID mới
	req.ID = uuid.New().String()

	// Insert vào database
	err := database.CreateMockAPI(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi lưu mock API: %v", err), http.StatusInternalServerError)
		return
	}

	// Đăng ký route động
	registerMockRoute(&req)

	// Trả về response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Tạo mock API thành công",
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
	var req model.TDAPIMockParam

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.ID == "" {
		http.Error(w, "ID là bắt buộc", http.StatusBadRequest)
		return
	}

	// Update database
	rowsAffected, err := database.UpdateMockAPI(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi cập nhật: %v", err), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Không tìm thấy mock API", http.StatusNotFound)
		return
	}

	// Hủy route cũ và đăng ký lại
	unregisterMockRoute(req.ID)
	registerMockRoute(&req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Cập nhật mock API thành công",
	})
}

/**
 * thực hiện xóa api mock
 */
func RemoveMockAPI(w http.ResponseWriter, r *http.Request) {
	// Lấy ID từ query parameter
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID là bắt buộc", http.StatusBadRequest)
		return
	}

	// Xóa khỏi database
	rowsAffected, err := database.DeleteMockAPI(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi xóa: %v", err), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Không tìm thấy mock API", http.StatusNotFound)
		return
	}

	// Hủy đăng ký route
	unregisterMockRoute(id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Xóa mock API thành công",
	})
}
