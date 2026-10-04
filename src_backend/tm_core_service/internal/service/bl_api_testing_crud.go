// file này chứa toàn bộ các method CURD liên quan tới database của testing api

package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"tm_core_service/internal/database"
	"tm_core_service/internal/model"
	"time"
)

// GetTestingAPICollection trả về cặp master-detail của API testing:
// bảng master là tm_api_testing_group, bảng detail là tm_api_testing.
//
// Cascade delete và endpoint get_tree đã có sẵn trong TMCollection, nên ở đây
// không cần viết thêm gì — đúng bằng 0 dòng business logic riêng.
func GetTestingAPICollection() *TMCollection[model.TMAPITestingGroup, model.TMAPITestingItem] {
	return NewCollection[model.TMAPITestingGroup, model.TMAPITestingItem](
		"api_testing_group",
		"api_testing",
	)
}

// Import batch API testing (giữ nguyên vì logic phức tạp nhiều bảng)
func BatchImportTestingData(w http.ResponseWriter, r *http.Request) {
	var batch model.TMAPITestingImportBatch
	if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	// Validate / Generate IDs if missing (backend safeguard)
	for i := range batch.Groups {
		if batch.Groups[i].ID == "" {
			batch.Groups[i].ID = fmt.Sprintf("group_%d_%d", time.Now().UnixNano(), i)
		}
	}
	for i := range batch.Items {
		if batch.Items[i].ID == "" {
			batch.Items[i].ID = fmt.Sprintf("test_%d_%d", time.Now().UnixNano(), i)
		}
	}

	err := database.BatchImportTestingData(&batch)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}

// GetTestingProModeAPICollection trả về cặp master-detail của API testing pro mode:
// bảng master là tm_api_testing_pro_mode_group, bảng detail là tm_api_testing_pro_mode
func GetTestingProModeAPICollection() *TMCollection[model.TMAPITestingProModeGroup, model.TMAPITestingProModeItem] {
	return NewCollection[model.TMAPITestingProModeGroup, model.TMAPITestingProModeItem](
		"api_testing_pro_mode_group",
		"api_testing_pro_mode",
	)
}

// BatchImportProModeTestingData import batch API testing promode (Groups + Items)
func BatchImportProModeTestingData(w http.ResponseWriter, r *http.Request) {
	var batch model.TMAPITestingProModeImportBatch
	if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	for i := range batch.Groups {
		if batch.Groups[i].ID == "" {
			batch.Groups[i].ID = fmt.Sprintf("pro_group_%d_%d", time.Now().UnixNano(), i)
		}
	}
	for i := range batch.Items {
		if batch.Items[i].ID == "" {
			batch.Items[i].ID = fmt.Sprintf("pro_test_%d_%d", time.Now().UnixNano(), i)
		}
	}

	err := database.BatchImportProModeData(&batch)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}
