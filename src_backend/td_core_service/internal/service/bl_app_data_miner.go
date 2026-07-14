package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// lấy danh sách toàn bộ bảng kèm columns (dùng cho intellisense)
func GetAllTableAndColumnsHandler(w http.ResponseWriter, r *http.Request) {
	allData, err := database.GetAllTableAndColumns()
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    allData,
	})
}

// thực hiện query tùy chỉnh cho user
func DataMinerExecuteQuery(w http.ResponseWriter, r *http.Request) {
	var req model.APIDataMinerQueryParam

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	allDataDynamic, err := database.DataMinerExecuteQuery(req.QueryCommand)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    allDataDynamic,
	})
}
