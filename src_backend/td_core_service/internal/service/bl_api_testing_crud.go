// file này chứa toàn bộ các method CURD liên quan tới database của testing api

package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"time"
)

// GetTestingAPIController trả về controller quản lý API testing
func GetTestingAPIController() *TDBLBase[model.TDAPITestingItem] {
	return &TDBLBase[model.TDAPITestingItem]{
		PathPrefix: "api_testing",
		Repo:       database.TDDLBase[model.TDAPITestingItem]{},
	}
}

func beforeDeleteTestingGroup(id string, r *http.Request) error {
	// Xóa các bảng liên quan trước ở tầng DL
	return database.DeleteTestingItemsByGroupID(id)
}

// GetTestingGroupController trả về controller quản lý nhóm API testing
func GetTestingGroupController() *TDBLBase[model.TDAPITestingGroup] {
	return &TDBLBase[model.TDAPITestingGroup]{
		PathPrefix:   "api_testing_group",
		Repo:         database.TDDLBase[model.TDAPITestingGroup]{},
		BeforeDelete: beforeDeleteTestingGroup,
	}
}

// Import batch API testing (giữ nguyên vì logic phức tạp nhiều bảng)
func BatchImportTestingData(w http.ResponseWriter, r *http.Request) {
	var batch model.TDAPITestingImportBatch
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

// GetTestingProModeAPIController trả về controller quản lý API testing promode
func GetTestingProModeAPIController() *TDBLBase[model.TDAPITestingProModeItem] {
	return &TDBLBase[model.TDAPITestingProModeItem]{
		PathPrefix: "api_testing_pro_mode",
		Repo:       database.TDDLBase[model.TDAPITestingProModeItem]{},
	}
}

func beforeDeleteTestingProModeGroup(id string, r *http.Request) error {
	// Xóa các item liên quan trước ở tầng DL
	return database.DeleteTestingProModeItemsByGroupID(id)
}

// GetTestingProModeGroupController trả về controller quản lý nhóm API testing promode
func GetTestingProModeGroupController() *TDBLBase[model.TDAPITestingProModeGroup] {
	return &TDBLBase[model.TDAPITestingProModeGroup]{
		PathPrefix:   "api_testing_pro_mode_group",
		Repo:         database.TDDLBase[model.TDAPITestingProModeGroup]{},
		BeforeDelete: beforeDeleteTestingProModeGroup,
	}
}
