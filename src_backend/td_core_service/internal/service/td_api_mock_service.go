package service

import (
	"encoding/json"
	"net/http"
	"td_core_service/internal/model"
)

/**
 * thực hiện tạo api mock
 */
func CreateMockAPI(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPIMockParam

	// Thay thế binding của Gin bằng json.Decoder
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}
}

/**
 * thực hiện lấy danh sách mock api
 */
func GetAllMockAPI(w http.ResponseWriter, r *http.Request) {
}

/**
 * thực hiện xóa api mock
 */
func RemoveMockAPI(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPIMockParam

	// Thay thế binding của Gin bằng json.Decoder
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}
}
