package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

/**
 * thực hiện lấy danh sách toàn bộ bảng trong database
 */
func GetAllTableInDatabase(w http.ResponseWriter, r *http.Request) {
	allTables, err := database.GetAllTableInDatabase()
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    allTables,
	})
}

/**
 * thực hiện lấy danh sách toàn bộ dữ liệu theo 1 bảng có trong database
 */
func GetAllDataByTableName(w http.ResponseWriter, r *http.Request) {
	currentTableName := r.URL.Query().Get("table_name")
	allDataByTableName, err := database.GetAllDataByTableName(currentTableName)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    allDataByTableName,
	})
}

/**
 * thực hiện query tùy chỉnh cho user
 */
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
