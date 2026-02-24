// file này chứa toàn bộ các method CURD liên quan tới database của mock api

package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"td_core_service/td_common"
)

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
