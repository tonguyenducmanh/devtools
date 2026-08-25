// file này chứa toàn bộ các method xử lý gọi nối API từ phía Client qua tool API testing
package service

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"td_core_service/internal/model"
	"td_config"
	"td_core_service/td_common"
)

// Shared HTTP client - tái sử dụng connection pool, tránh tạo mới transport mỗi request
// Được khởi tạo 1 lần duy nhất khi package load, đọc config từ td_config
var sharedHTTPClient = buildHTTPClient()

func buildHTTPClient() *http.Client {
	cfg := td_config.GetConfigGlobal().HTTPClientConfig
	return &http.Client{
		Transport: &http.Transport{
			TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
			MaxIdleConns:          cfg.MaxIdleConns,
			MaxIdleConnsPerHost:   cfg.MaxIdleConnsPerHost,
			IdleConnTimeout:       cfg.IdleConnTimeout,
			TLSHandshakeTimeout:   cfg.TLSHandshakeTimeout,
		},
		Timeout: cfg.ClientTimeout,
	}
}

/**
 * thực hiện request
 */
func Execute(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPITestingParam

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		td_common.LogError(fmt.Sprintf("Dữ liệu không hợp lệ: %v", err))
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	result, err := executeRequest(req)
	if err != nil {
		td_common.LogError(fmt.Sprintf("executeRequest thất bại: %v", err))
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
	// Tạo request
	req, err := http.NewRequest(strings.ToUpper(reqData.HttpMethod), reqData.ApiURL, bytes.NewBufferString(reqData.BodyText))
	if err != nil {
		td_common.LogError(fmt.Sprintf("Tạo request thất bại: %v", err))
		return nil, err
	}

	// Thêm headers
	headers := parseHeaders(reqData.HeadersText)
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	// Thực thi bằng shared client (tái sử dụng connection pool)
	resp, err := sharedHTTPClient.Do(req)
	if err != nil {
		td_common.LogError(fmt.Sprintf("Request failed: %v", err))
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	// Đọc body trả về
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		td_common.LogError(fmt.Sprintf("Đọc response body thất bại: %v", err))
		return nil, fmt.Errorf("đọc response body thất bại: %v", err)
	}

	// Ép kiểu headers về JSON string như code cũ
	headerJson, _ := json.Marshal(resp.Header)

	return &model.TDAPITestingResponse{
		Status:  resp.StatusCode,
		Headers: string(headerJson),
		Body:    string(respBody),
	}, nil
}

// parse header được stringify từ frontend
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
