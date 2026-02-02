package service

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

/**
 * thực hiện request
 */
func Execute(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPITestingParam

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	result, err := executeRequest(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

/**
 * thực hiện gọi nối api cho frontend
 */
func executeRequest(reqData model.TDAPITestingParam) (*model.TDAPITestingResponse, error) {
	// Cấu hình Client bỏ qua SSL (tương đương rejectUnauthorized: false)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	// Tạo request
	req, err := http.NewRequest(strings.ToUpper(reqData.HttpMethod), reqData.ApiURL, bytes.NewBufferString(reqData.BodyText))
	if err != nil {
		return nil, err
	}

	// Thêm headers
	headers := parseHeaders(reqData.HeadersText)
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	// Thực thi
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	// Đọc body trả về
	respBody, _ := io.ReadAll(resp.Body)

	// Ép kiểu headers về JSON string như code cũ
	headerJson, _ := json.Marshal(resp.Header)

	// log dữ liệu vào db
	logDataCallAPIToDatabase(reqData, string(respBody), resp.StatusCode)

	return &model.TDAPITestingResponse{
		Status:  resp.StatusCode,
		Headers: string(headerJson),
		Body:    string(respBody),
	}, nil
}

/**
 * log dữ liệu vào db
 */
func logDataCallAPIToDatabase(reqData model.TDAPITestingParam, responseText string, statusCode int) {
	id := GenUUID()
	database.LogDataCallAPIToDatabase(reqData, responseText, statusCode, id)
}

/**
 * Lấy tất cả API testing
 */
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

/**
 * Tạo API testing mới
 */
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

/**
 * Cập nhật API testing
 */
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

/**
 * Xóa API testing
 */
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

/**
 * Lấy tất cả nhóm API testing
 */
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

/**
 * Tạo nhóm API testing mới
 */
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

/**
 * Cập nhật nhóm API testing
 */
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

/**
 * Xóa nhóm API testing
 */
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

/**
 * parse header được stringify từ frontend
 */
func parseHeaders(text string) map[string]string {
	headers := make(map[string]string)
	lines := strings.Split(text, "\n")
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		parts := strings.SplitN(trimmed, ":", 2)
		if len(parts) == 2 {
			headers[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}
	return headers
}

/**
 * Import batch API testing
 */
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
