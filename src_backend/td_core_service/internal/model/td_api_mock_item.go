package model

import "strings"

// param api mock muốn tạo
type TDAPIMockItem struct {
	TDBaseModel
	RequestName string `json:"request_name"`
	GroupID     string `json:"group_id"`
	Method      string `json:"method"`
	Endpoint    string `json:"end_point"`
	HeadersText string `json:"headers_text"`
	BodyText    string `json:"body_text"`
	// BodyType là kiểu body: json hoặc form_data
	BodyType string `json:"body_type"`
	// FormDataText là danh sách field của body form_data, lưu dạng json
	// không lưu nội dung file (base64) vì quá nặng, chỉ lưu tên file và kiểu
	FormDataText        string `json:"form_data_text"`
	ResponeText         string `json:"response_text"`
	ResponseHeadersText string `json:"response_headers_text"`
	StatusCode          int    `json:"status_code"`
}

func (m TDAPIMockItem) TableName() string {
	return "td_api_mock"
}

// IsFormData kiểm tra body của mock có phải multipart/form-data không
func (m TDAPIMockItem) IsFormData() bool {
	return m.BodyType == TDAPIBodyTypeFormData
}

// HasBody kiểm tra mock có khai báo body để đối chiếu với request không.
// Mock không khai báo body thì được dùng làm mặc định cho mọi request cùng endpoint
func (m TDAPIMockItem) HasBody() bool {
	if m.IsFormData() {
		return strings.TrimSpace(m.FormDataText) != "" && m.FormDataText != "null"
	}
	return strings.TrimSpace(m.BodyText) != "" && m.BodyText != "null"
}

// model quản lý nhóm của api mock
type TDAPIMockGroup struct {
	TDBaseModel
	Name string `json:"name"`
}

func (g TDAPIMockGroup) TableName() string {
	return "td_api_mock_group"
}
