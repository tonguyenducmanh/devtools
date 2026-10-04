// file này chứa toàn bộ các method xử lý gọi nối API từ phía Client qua tool API testing
package service

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"

	"tm_config"
	"tm_core_service/internal/model"
	"tm_core_service/tm_common"
)

// Shared HTTP client - tái sử dụng connection pool, tránh tạo mới transport mỗi request
// Được khởi tạo 1 lần duy nhất khi package load, đọc config từ tm_config
var sharedHTTPClient = buildHTTPClient()

func buildHTTPClient() *http.Client {
	cfg := tm_config.GetConfigGlobal().HTTPClientConfig
	return &http.Client{
		Transport: &http.Transport{
			TLSClientConfig:     &tls.Config{InsecureSkipVerify: true},
			MaxIdleConns:        cfg.MaxIdleConns,
			MaxIdleConnsPerHost: cfg.MaxIdleConnsPerHost,
			IdleConnTimeout:     cfg.IdleConnTimeout,
			TLSHandshakeTimeout: cfg.TLSHandshakeTimeout,
		},
		Timeout: cfg.ClientTimeout,
	}
}

/**
 * thực hiện request
 */
func Execute(w http.ResponseWriter, r *http.Request) {
	var req model.TMAPITestingParam

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		tm_common.LogError(fmt.Sprintf("Dữ liệu không hợp lệ: %v", err))
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	result, err := executeRequest(req)
	if err != nil {
		tm_common.LogError(fmt.Sprintf("executeRequest thất bại: %v", err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

/**
 * thực hiện gọi nối api cho frontend
 */
func executeRequest(reqData model.TMAPITestingParam) (*model.TMAPITestingResponse, error) {
	// Tạo request, body dạng nào phụ thuộc vào body_type do frontend gửi lên
	req, err := buildRequest(reqData)
	if err != nil {
		tm_common.LogError(fmt.Sprintf("Tạo request thất bại: %v", err))
		return nil, err
	}

	// Thêm headers
	// Với form data thì content-type đã có sẵn boundary do multipart sinh ra,
	// nên bỏ qua content-type frontend gửi lên để không phá boundary
	headers := parseHeaders(reqData.HeadersText)
	for k, v := range headers {
		if reqData.IsFormData() && strings.EqualFold(k, "Content-Type") {
			continue
		}
		req.Header.Set(k, v)
	}

	// Thực thi bằng shared client (tái sử dụng connection pool)
	resp, err := sharedHTTPClient.Do(req)
	if err != nil {
		tm_common.LogError(fmt.Sprintf("Request failed: %v", err))
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	// Đọc body trả về
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		tm_common.LogError(fmt.Sprintf("Đọc response body thất bại: %v", err))
		return nil, fmt.Errorf("đọc response body thất bại: %v", err)
	}

	// Ép kiểu headers về JSON string như code cũ
	headerJson, _ := json.Marshal(resp.Header)

	return &model.TMAPITestingResponse{
		Status:  resp.StatusCode,
		Headers: string(headerJson),
		Body:    string(respBody),
	}, nil
}

/**
 * buildRequest tạo http request theo kiểu body của frontend gửi lên
 */
func buildRequest(reqData model.TMAPITestingParam) (*http.Request, error) {
	if reqData.IsFormData() {
		return buildFormDataRequest(reqData)
	}
	return buildTextRequest(reqData)
}

/**
 * buildTextRequest tạo http request với body dạng text (json, ...)
 */
func buildTextRequest(reqData model.TMAPITestingParam) (*http.Request, error) {
	return http.NewRequest(strings.ToUpper(reqData.HttpMethod), reqData.ApiURL, bytes.NewBufferString(reqData.BodyText))
}

/**
 * buildFormDataRequest tạo http request với body dạng multipart/form-data
 */
func buildFormDataRequest(reqData model.TMAPITestingParam) (*http.Request, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	for _, field := range reqData.FormData {
		if err := writeFormField(writer, field); err != nil {
			tm_common.LogError(fmt.Sprintf("Ghi field %s thất bại: %v", field.Key, err))
			return nil, err
		}
	}

	// đóng writer để ghi boundary xuống buffer
	if err := writer.Close(); err != nil {
		return nil, err
	}

	req, err := http.NewRequest(strings.ToUpper(reqData.HttpMethod), reqData.ApiURL, &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	return req, nil
}

/**
 * writeFormField ghi 1 field của body form data, field dạng text hoặc file
 */
func writeFormField(writer *multipart.Writer, field model.TMAPIFormField) error {
	// field không có key thì bỏ qua
	if strings.TrimSpace(field.Key) == "" {
		return nil
	}

	// field dạng text
	if !field.IsFile() {
		return writer.WriteField(field.Key, field.Value)
	}

	// field dạng file, nội dung file do frontend encode base64 gửi lên
	content, err := decodeFileContent(field.FileContent)
	if err != nil {
		return err
	}
	fileName := field.FileName
	if fileName == "" {
		fileName = field.Key
	}
	part, err := createFormFilePart(writer, field.Key, fileName, field.FileContentType)
	if err != nil {
		return err
	}
	_, err = part.Write(content)
	return err
}

/**
 * createFormFilePart tạo part cho field dạng file, tự set content-type theo file
 * vì hàm CreateFormFile của thư viện luôn dùng application/octet-stream
 */
func createFormFilePart(writer *multipart.Writer, fieldKey string, fileName string, fileContentType string) (io.Writer, error) {
	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(
		`form-data; name="%s"; filename="%s"`,
		escapeQuotes(fieldKey),
		escapeQuotes(fileName),
	))
	// không có content type thì dùng mặc định như thư viện multipart
	if fileContentType == "" {
		fileContentType = "application/octet-stream"
	}
	header.Set("Content-Type", fileContentType)
	return writer.CreatePart(header)
}

/**
 * escapeQuotes escape dấu nháy và dấu gạch chéo trong tên field/tên file,
 * giống cách thư viện multipart xử lý khi tạo part
 */
func escapeQuotes(text string) string {
	text = strings.ReplaceAll(text, "\\", "\\\\")
	return strings.ReplaceAll(text, `"`, `\"`)
}

/**
 * decodeFileContent giải mã nội dung file base64 do frontend gửi lên,
 * có chấp nhận cả định dạng data uri kiểu data:image/png;base64,...
 */
func decodeFileContent(fileContent string) ([]byte, error) {
	if fileContent == "" {
		return []byte{}, nil
	}
	// bỏ tiền tố data uri nếu frontend gửi theo dạng đó
	if index := strings.Index(fileContent, ";base64,"); index != -1 {
		fileContent = fileContent[index+len(";base64,"):]
	}
	content, err := base64.StdEncoding.DecodeString(fileContent)
	if err != nil {
		return nil, fmt.Errorf("nội dung file không phải base64 hợp lệ: %v", err)
	}
	return content, nil
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
