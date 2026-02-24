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

// Lấy tất cả API testing
func GetAllTestingAPIs(w http.ResponseWriter, r *http.Request) {
	tests, err := database.GetAllTestingAPIs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    tests,
	})
}

// Tạo API testing mới
func CreateTestingAPI(w http.ResponseWriter, r *http.Request) {
	var test model.TDAPITestingItem
	if err := json.NewDecoder(r.Body).Decode(&test); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	// Tạo ID nếu chưa có
	if test.ID == "" {
		test.ID = fmt.Sprintf("test_%d", time.Now().UnixNano())
	}

	err := database.CreateTestingAPI(&test)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    test,
	})
}

// Cập nhật API testing
func UpdateTestingAPI(w http.ResponseWriter, r *http.Request) {
	var test model.TDAPITestingItem
	if err := json.NewDecoder(r.Body).Decode(&test); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	rowsAffected, err := database.UpdateTestingAPI(&test)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    rowsAffected > 0,
	})
}

// Xóa API testing
func DeleteTestingAPI(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID không hợp lệ", http.StatusBadRequest)
		return
	}

	rowsAffected, err := database.DeleteTestingAPI(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    rowsAffected > 0,
	})
}

// Lấy tất cả nhóm API testing
func GetAllTestingGroups(w http.ResponseWriter, r *http.Request) {
	groups, err := database.GetAllTestingGroups()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    groups,
	})
}

// Tạo nhóm API testing mới
func CreateTestingGroup(w http.ResponseWriter, r *http.Request) {
	var group model.TDAPITestingGroup
	if err := json.NewDecoder(r.Body).Decode(&group); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	// Tạo ID nếu chưa có
	if group.ID == "" {
		group.ID = fmt.Sprintf("group_%d", time.Now().UnixNano())
	}

	err := database.CreateTestingGroup(&group)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    group,
	})
}

// Cập nhật nhóm API testing
func UpdateTestingGroup(w http.ResponseWriter, r *http.Request) {
	var group model.TDAPITestingGroup
	if err := json.NewDecoder(r.Body).Decode(&group); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	rowsAffected, err := database.UpdateTestingGroup(&group)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    rowsAffected > 0,
	})
}

// Xóa nhóm API testing
func DeleteTestingGroup(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID không hợp lệ", http.StatusBadRequest)
		return
	}

	err := database.DeleteTestingGroup(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    true,
	})
}

// Import batch API testing
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
