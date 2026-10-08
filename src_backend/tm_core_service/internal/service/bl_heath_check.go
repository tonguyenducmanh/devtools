package service

import (
	"encoding/json"
	"net/http"
	"tm_config"
)

// kiểu dữ liệu response của API health check
type TMHeathCheckResponse struct {
	// service có sống hay không
	Success bool `json:"success"`
	// message mô tả trạng thái, dùng để hiển thị lên UI
	Message string `json:"message"`
	// version của BE đang chạy
	BEVersion string `json:"beVersion"`
}

// kiểm tra service có sống không
//
// Ngoài việc trả về service còn sống hay không, API còn trả về version của
// BE đang chạy để UI hiển thị, dùng để đối chiếu với version của UI.
func HeathCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TMHeathCheckResponse{
		Success:   true,
		Message:   "API service is ready",
		BEVersion: tm_config.Version,
	})
}
