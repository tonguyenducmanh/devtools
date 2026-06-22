// file này chứa logic thực thi SQL query tới PostgreSQL và load intellisense

package service

import (
	"encoding/json"
	"net/http"
	"td_core_service/internal/database/postgresql"
	"td_core_service/internal/model"
)

// ExecutePostgreSQLQueryHandler nhận connection_id + sql, tìm connection string từ cache,
// thực thi script (có thể gồm nhiều câu lệnh cách nhau bởi ";"), trả về danh sách kết quả -
// mỗi statement tương ứng 1 result set
func ExecutePostgreSQLQueryHandler(w http.ResponseWriter, r *http.Request) {
	var req model.TDPostgeSQLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.ConnectionID == "" || req.SQL == "" {
		http.Error(w, "connection_id và sql là bắt buộc", http.StatusBadRequest)
		return
	}

	// Lấy connection từ cache (tránh đọc SQLite mỗi lần)
	conn, err := postgresql.GetCachedPostgreSQLConnection(req.ConnectionID)
	if err != nil {
		http.Error(w, "Không tìm thấy connection", http.StatusNotFound)
		return
	}

	if conn.ConnectType != 0 {
		http.Error(w, "connect_type != 0 chưa được hỗ trợ", http.StatusBadRequest)
		return
	}

	result, err := postgresql.ExecutePostgreSQLQuery(conn.ConnectionString, req.SQL)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": err.Error(),
			"data":    result,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    result,
	})
}
