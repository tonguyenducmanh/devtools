package service

import (
	"context"
	"encoding/json"
	"fmt"
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
		for i := range mocks {
			registerMockRouteOnMux(mux, &mocks[i])
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
 * Đăng ký route vào mux cụ thể
 */
func registerMockRouteOnMux(mux *http.ServeMux, mock *model.TDAPIMockItem) {
	endpoint := mock.Endpoint
	if !strings.HasPrefix(endpoint, "/") {
		endpoint = "/" + endpoint
	}

	pattern := fmt.Sprintf("%s %s", mock.Method, endpoint)

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

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(mock.ResponeText))
	}

	mux.HandleFunc(pattern, handler)
	fmt.Printf("Đã đăng ký mock API: %s\n", pattern)
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
