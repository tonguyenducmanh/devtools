package service

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"td_api_service/internal/model"
)

type APITestService interface {
	ExecuteRequest(req model.ExecuteRequest, trace *bool) (*model.ExecuteResponse, error)
}

type apiTestService struct{}

func NewAPITestService() APITestService {
	return &apiTestService{}
}

/**
 * parse header được stringify từ frontend
 */
func (s *apiTestService) parseHeaders(text string) map[string]string {
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
 * thực hiện gọi nối api cho frontend
 */
func (s *apiTestService) ExecuteRequest(reqData model.ExecuteRequest, trace *bool) (*model.ExecuteResponse, error) {
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
	headers := s.parseHeaders(reqData.HeadersText)
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

	if *trace {
		reqDataText, _ := json.Marshal(reqData)
		fmt.Printf("Call api request: %s", string(reqDataText))
		fmt.Printf("Call api response: %s", string(respBody))
	}

	// Ép kiểu headers về JSON string như code cũ
	headerJson, _ := json.Marshal(resp.Header)

	return &model.ExecuteResponse{
		Status:  resp.StatusCode,
		Headers: string(headerJson),
		Body:    string(respBody),
	}, nil
}
