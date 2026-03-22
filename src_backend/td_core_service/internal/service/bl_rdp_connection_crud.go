// file này chứa toàn bộ các method CRUD liên quan tới database của RDP connection

package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"td_core_service/td_common"
)

// thực hiện tạo RDP connection
func CreateRDPConnection(w http.ResponseWriter, r *http.Request) {
	var req model.TDRDPConnection

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.ConnectionName == "" || req.Host == "" {
		http.Error(w, "connection_name và host là bắt buộc", http.StatusBadRequest)
		return
	}

	req.ID = td_common.GenUUID()

	err := database.CreateRDPConnection(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi lưu RDP connection: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Tạo RDP connection thành công",
		"data":    req,
	})
}

// thực hiện lấy danh sách RDP connections
func GetAllRDPConnections(w http.ResponseWriter, r *http.Request) {
	connections, err := database.GetAllRDPConnections()
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    connections,
	})
}

// thực hiện cập nhật RDP connection
func UpdateRDPConnection(w http.ResponseWriter, r *http.Request) {
	var req model.TDRDPConnection

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.ID == "" {
		http.Error(w, "ID là bắt buộc", http.StatusBadRequest)
		return
	}

	rowsAffected, err := database.UpdateRDPConnection(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi cập nhật: %v", err), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Không tìm thấy RDP connection", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Cập nhật RDP connection thành công",
	})
}

// thực hiện xóa RDP connection
func DeleteRDPConnection(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID là bắt buộc", http.StatusBadRequest)
		return
	}

	rowsAffected, err := database.DeleteRDPConnection(id)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi xóa: %v", err), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Không tìm thấy RDP connection", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Xóa RDP connection thành công",
	})
}
