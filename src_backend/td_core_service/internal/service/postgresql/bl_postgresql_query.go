// file này chứa logic thực thi SQL query tới PostgreSQL và load intellisense

package postgresql

import (
	"encoding/json"
	"fmt"
	"net/http"
	pgdb "td_core_service/internal/database/postgresql"
	"td_core_service/internal/model"
	"td_core_service/td_common"
)

// ExecutePostgreSQLQueryHandler nhận connection_id + sql, tìm connection string từ cache,
// thực thi script (có thể gồm nhiều câu lệnh cách nhau bởi ";"), trả về danh sách kết quả -
// mỗi statement tương ứng 1 result set
func ExecutePostgreSQLQueryHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			td_common.LogError(fmt.Sprintf("PANIC in ExecutePostgreSQLQueryHandler: %v", rec))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": fmt.Sprintf("Internal server error: %v", rec),
			})
		}
	}()

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
	conn, err := pgdb.GetCachedPostgreSQLConnection(req.ConnectionID)
	if err != nil {
		http.Error(w, "Không tìm thấy connection", http.StatusNotFound)
		return
	}

	if conn.ConnectType != 0 {
		http.Error(w, "connect_type != 0 chưa được hỗ trợ", http.StatusBadRequest)
		return
	}

	result, err := pgdb.ExecutePostgreSQLQuery(conn.ConnectionString, req.SQL, req.DefaultLimit, req.Unlimited)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		if encodeErr := json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": err.Error(),
			"data":    result,
		}); encodeErr != nil {
			td_common.LogError(fmt.Sprintf("Lỗi encode JSON response (error case): %v", encodeErr))
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if encodeErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    result,
	}); encodeErr != nil {
		td_common.LogError(fmt.Sprintf("Lỗi encode JSON response (success case): %v", encodeErr))
	}
}
