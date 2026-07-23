package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"td_core_service/td_common"
)

type readFileRequest struct {
	FilePath string `json:"file_path"`
}

type readFolderRequest struct {
	FolderPath string `json:"folder_path"`
}

type folderFileItem struct {
	Name    string `json:"name"`
	Content string `json:"content"`
}

// ReadFileHandler đọc nội dung 1 file từ máy local
func ReadFileHandler(w http.ResponseWriter, r *http.Request) {
	var req readFileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.FilePath == "" {
		http.Error(w, "file_path là bắt buộc", http.StatusBadRequest)
		return
	}

	// làm sạch path
	cleanPath := filepath.Clean(req.FilePath)

	info, err := os.Stat(cleanPath)
	if err != nil {
		td_common.LogError(fmt.Sprintf("ReadFile - không tìm thấy file: %v", err))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Không tìm thấy file: %s", cleanPath),
		})
		return
	}

	if info.IsDir() {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Đường dẫn là thư mục, không phải file: %s", cleanPath),
		})
		return
	}

	data, err := os.ReadFile(cleanPath)
	if err != nil {
		td_common.LogError(fmt.Sprintf("ReadFile - lỗi đọc file: %v", err))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Lỗi đọc file: %v", err),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    string(data),
	})
}

// ReadFolderHandler đọc tất cả file trong 1 folder (không đệ quy)
func ReadFolderHandler(w http.ResponseWriter, r *http.Request) {
	var req readFolderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.FolderPath == "" {
		http.Error(w, "folder_path là bắt buộc", http.StatusBadRequest)
		return
	}

	cleanPath := filepath.Clean(req.FolderPath)

	info, err := os.Stat(cleanPath)
	if err != nil {
		td_common.LogError(fmt.Sprintf("ReadFolder - không tìm thấy folder: %v", err))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Không tìm thấy thư mục: %s", cleanPath),
		})
		return
	}

	if !info.IsDir() {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Đường dẫn không phải thư mục: %s", cleanPath),
		})
		return
	}

	// các extension được phép đọc
	allowedExts := map[string]bool{
		".json": true, ".txt": true, ".js": true, ".ts": true,
		".md": true, ".csv": true, ".xml": true, ".yaml": true, ".yml": true,
		".sql": true, ".html": true, ".css": true, ".env": true, ".conf": true,
		".log": true, ".go": true, ".py": true, ".java": true, ".cs": true,
		".sh": true, ".vue": true, ".jsx": true, ".tsx": true,
	}

	entries, err := os.ReadDir(cleanPath)
	if err != nil {
		td_common.LogError(fmt.Sprintf("ReadFolder - lỗi đọc thư mục: %v", err))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": fmt.Sprintf("Lỗi đọc thư mục: %v", err),
		})
		return
	}

	var results []folderFileItem

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if !allowedExts[ext] {
			continue
		}

		fullPath := filepath.Join(cleanPath, entry.Name())

		data, err := os.ReadFile(fullPath)
		if err != nil {
			continue
		}

		results = append(results, folderFileItem{
			Name:    entry.Name(),
			Content: string(data),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    results,
	})
}
