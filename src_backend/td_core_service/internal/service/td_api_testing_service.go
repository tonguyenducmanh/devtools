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
)

/**
 * kiểm tra service có sống không
 */
func HeathCheck(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "API service is ready")
}

/**
 * thực hiện request
 */
func Execute(w http.ResponseWriter, r *http.Request) {
	var req model.TDAPITestingParam

	// Thay thế binding của Gin bằng json.Decoder
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

	return &model.TDAPITestingResponse{
		Status:  resp.StatusCode,
		Headers: string(headerJson),
		Body:    string(respBody),
	}, nil
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
