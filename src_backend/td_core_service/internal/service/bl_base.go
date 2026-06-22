package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"td_core_service/internal/database"
)

// TDBLBase cung cấp các endpoint chuẩn (GET, POST, PUT, DELETE) cho một Model
// Nó có các hook function để có thể override giống tính đa hình của OOP.
type TDBLBase[T database.TDModelBase] struct {
	PathPrefix string
	Repo       database.TDDLBase[T]

	// Các hooks để override/chèn logic business
	BeforeInsert func(req *T, r *http.Request) error
	AfterInsert  func(req *T, r *http.Request)
	BeforeUpdate func(req *T, r *http.Request) error
	AfterUpdate  func(req *T, r *http.Request)
	BeforeDelete func(id string, r *http.Request) error
	AfterDelete  func(id string, r *http.Request)

	// Override toàn bộ thao tác xoá (ví dụ: cần xóa nhiều bảng trong transaction)
	CustomDelete func(id string, r *http.Request) error

	// Override toàn bộ thao tác tạo (ví dụ: ghi bất đồng bộ)
	CustomCreate func(req *T, r *http.Request) error
}

func (c *TDBLBase[T]) RegisterRoutes(app *http.ServeMux) {
	app.HandleFunc(fmt.Sprintf("GET /%s/get_all", c.PathPrefix), c.GetAll)
	app.HandleFunc(fmt.Sprintf("POST /%s/create", c.PathPrefix), c.Create)
	app.HandleFunc(fmt.Sprintf("PUT /%s/update", c.PathPrefix), c.Update)
	app.HandleFunc(fmt.Sprintf("DELETE /%s/delete_by_id", c.PathPrefix), c.Delete)
}

func (c *TDBLBase[T]) GetAll(w http.ResponseWriter, r *http.Request) {
	items, err := c.Repo.GetAll()
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi query: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    items,
	})
}

func (c *TDBLBase[T]) Create(w http.ResponseWriter, r *http.Request) {
	var req T

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if c.BeforeInsert != nil {
		if err := c.BeforeInsert(&req, r); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	if c.CustomCreate != nil {
		if err := c.CustomCreate(&req, r); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		err := c.Repo.Insert(&req)
		if err != nil {
			http.Error(w, fmt.Sprintf("Lỗi lưu dữ liệu: %v", err), http.StatusInternalServerError)
			return
		}
	}

	if c.AfterInsert != nil {
		c.AfterInsert(&req, r)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Tạo dữ liệu thành công",
		"data":    req,
	})
}

func (c *TDBLBase[T]) Update(w http.ResponseWriter, r *http.Request) {
	var req T

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if c.BeforeUpdate != nil {
		if err := c.BeforeUpdate(&req, r); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	rowsAffected, err := c.Repo.Update(&req)
	if err != nil {
		http.Error(w, fmt.Sprintf("Lỗi cập nhật: %v", err), http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		http.Error(w, "Không tìm thấy dữ liệu", http.StatusNotFound)
		return
	}

	if c.AfterUpdate != nil {
		c.AfterUpdate(&req, r)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Cập nhật dữ liệu thành công",
	})
}

func (c *TDBLBase[T]) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "ID là bắt buộc", http.StatusBadRequest)
		return
	}

	if c.BeforeDelete != nil {
		if err := c.BeforeDelete(id, r); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	}

	if c.CustomDelete != nil {
		if err := c.CustomDelete(id, r); err != nil {
			http.Error(w, fmt.Sprintf("Lỗi xóa: %v", err), http.StatusInternalServerError)
			return
		}
	} else {
		rowsAffected, err := c.Repo.Delete(id)
		if err != nil {
			http.Error(w, fmt.Sprintf("Lỗi xóa: %v", err), http.StatusInternalServerError)
			return
		}

		if rowsAffected == 0 {
			http.Error(w, "Không tìm thấy dữ liệu", http.StatusNotFound)
			return
		}
	}

	if c.AfterDelete != nil {
		c.AfterDelete(id, r)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Xóa dữ liệu thành công",
	})
}
