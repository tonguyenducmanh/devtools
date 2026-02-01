package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
)

/**
 * thực hiện lấy danh sách toàn bộ bảng trong database
 */
func GetAllTableInDatabase(w http.ResponseWriter, r *http.Request) {
	mocks, err := database.GetAllTableInDatabase()
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
