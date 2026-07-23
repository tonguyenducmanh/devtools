package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"td_core_service/td_common"
)

type mockImportBatchRequest struct {
	Mocks []model.TDAPIMockItem `json:"mocks"`
}

// BatchImportMockAPIs import hàng loạt mock APIs
func BatchImportMockAPIs(w http.ResponseWriter, r *http.Request) {
	var req mockImportBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if len(req.Mocks) == 0 {
		http.Error(w, "Không có mock nào", http.StatusBadRequest)
		return
	}

	for i := range req.Mocks {
		if req.Mocks[i].ID == "" {
			req.Mocks[i].ID = td_common.GenUUID()
		}
	}

	repo := database.TDDLBase[model.TDAPIMockItem]{}
	err := repo.InsertBatch(req.Mocks)
	if err != nil {
		td_common.LogError(fmt.Sprintf("BatchImportMockAPIs - lỗi import: %v", err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	go RestartMockServer()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"count":   len(req.Mocks),
	})
}
