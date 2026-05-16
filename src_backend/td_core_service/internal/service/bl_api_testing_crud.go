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
func GetTestingAPIController() *BaseCRUDController[model.TDAPITestingItem] {
	return &BaseCRUDController[model.TDAPITestingItem]{
		PathPrefix:   "api_testing",
		Repo:         database.BaseRepository[model.TDAPITestingItem]{},
	}
}



func customDeleteTestingGroup(id string, r *http.Request) error {
	// Xóa group và các test bên trong nó qua db transaction
	return database.DeleteTestingGroup(id)
}

// GetTestingGroupController trả về controller quản lý nhóm API testing
func GetTestingGroupController() *BaseCRUDController[model.TDAPITestingGroup] {
	return &BaseCRUDController[model.TDAPITestingGroup]{
		PathPrefix:   "api_testing_group",
		Repo:         database.BaseRepository[model.TDAPITestingGroup]{},
		CustomDelete: customDeleteTestingGroup,
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
