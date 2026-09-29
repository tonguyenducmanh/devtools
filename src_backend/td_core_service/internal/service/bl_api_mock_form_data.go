package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"strings"

	"td_core_service/internal/model"
	"td_core_service/td_common"
)

// formDataRequest là các field đọc được từ body multipart của 1 request
type formDataRequest struct {
	Fields []model.TDAPIFormField
}

// parseFormDataRequest đọc các field từ body multipart của request.
// Trả về nil nếu request không gửi body dạng multipart/form-data
func parseFormDataRequest(r *http.Request, body []byte) *formDataRequest {
	mediaType, params, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || !strings.HasPrefix(mediaType, "multipart/") {
		return nil
	}
	boundary := params["boundary"]
	if boundary == "" {
		return nil
	}

	reader := multipart.NewReader(bytes.NewReader(body), boundary)
	result := &formDataRequest{Fields: []model.TDAPIFormField{}}
	for {
		part, err := reader.NextPart()
		if err != nil {
			// đã đọc hết các part hoặc body sai định dạng, dừng luôn
			break
		}
		field := readFormDataPart(part)
		part.Close()
		if field == nil {
			continue
		}
		result.Fields = append(result.Fields, *field)
	}
	return result
}

// readFormDataPart đọc 1 part của multipart, không đọc nội dung file vì mock
// chỉ đối chiếu theo key và tên file, database không lưu nội dung file
func readFormDataPart(part *multipart.Part) *model.TDAPIFormField {
	key := part.FormName()
	if strings.TrimSpace(key) == "" {
		return nil
	}

	// part có filename là field dạng file
	if fileName := part.FileName(); fileName != "" {
		return &model.TDAPIFormField{
			Key:      key,
			Type:     model.TDAPIFormFieldTypeFile,
			FileName: fileName,
		}
	}

	// field dạng text
	value, err := io.ReadAll(part)
	if err != nil {
		return nil
	}
	return &model.TDAPIFormField{
		Key:   key,
		Value: string(value),
		Type:  model.TDAPIFormFieldTypeText,
	}
}

// formDataEquivalent so sánh các field của request với form_data_text đã lưu của mock.
// File chỉ so khớp theo key và tên file vì database không lưu nội dung file
func formDataEquivalent(fields []model.TDAPIFormField, mockFormDataText string) bool {
	if strings.TrimSpace(mockFormDataText) == "" {
		return false
	}
	var mockFields []model.TDAPIFormFieldSaved
	if err := json.Unmarshal([]byte(mockFormDataText), &mockFields); err != nil {
		td_common.LogError(fmt.Sprintf("form data của mock không phải json hợp lệ: %v", err))
		return false
	}
	return equivalentFormFields(fields, mockFields)
}

// equivalentFormFields so khớp 2 danh sách field, bỏ qua thứ tự các field
// vì thứ tự part multipart không ảnh hưởng tới ý nghĩa của request
func equivalentFormFields(requestFields []model.TDAPIFormField, mockFields []model.TDAPIFormFieldSaved) bool {
	// field không có key thì không tham gia đối chiếu, giống lúc dựng request
	countRequest := 0
	for _, field := range requestFields {
		if strings.TrimSpace(field.Key) != "" {
			countRequest++
		}
	}

	countMock := 0
	for _, mockField := range mockFields {
		if strings.TrimSpace(mockField.Key) == "" {
			continue
		}
		countMock++
		if !findMatchingRequestField(requestFields, mockField) {
			return false
		}
	}
	return countRequest == countMock
}

// findMatchingRequestField tìm trong các field của request có field khớp với field của mock
func findMatchingRequestField(requestFields []model.TDAPIFormField, mockField model.TDAPIFormFieldSaved) bool {
	for _, requestField := range requestFields {
		if requestField.Key != mockField.Key {
			continue
		}
		if requestField.IsFile() != mockField.IsFile() {
			continue
		}
		if mockField.IsFile() {
			// file so khớp theo tên file, nội dung file không lưu nên không so sánh được
			if requestField.FileName == mockField.FileName {
				return true
			}
			continue
		}
		if requestField.Value == mockField.Value {
			return true
		}
	}
	return false
}
