// file này chứa logic thực thi SQL query tới PostgreSQL và load intellisense

package service

import (
	"encoding/json"
	"net/http"
	"strings"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
)

// request body cho execute query
type executeQueryRequest struct {
	ConnectionID string `json:"connection_id"`
	SQL          string `json:"sql"`
}

// ExecutePostgreSQLQueryHandler nhận connection_id + sql, tìm connection string từ SQLite, thực thi query
func ExecutePostgreSQLQueryHandler(w http.ResponseWriter, r *http.Request) {
	var req executeQueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.ConnectionID == "" || req.SQL == "" {
		http.Error(w, "connection_id và sql là bắt buộc", http.StatusBadRequest)
		return
	}

	// Lấy connection từ SQLite
	repo := database.TDDLBase[model.TDPostgreSQLConnection]{}
	conn, err := repo.GetByID(req.ConnectionID)
	if err != nil || conn == nil {
		http.Error(w, "Không tìm thấy connection", http.StatusNotFound)
		return
	}

	if conn.ConnectType != 0 {
		http.Error(w, "connect_type != 0 chưa được hỗ trợ", http.StatusBadRequest)
		return
	}

	// Xác định câu lệnh SELECT hay non-query dựa vào từ khóa đầu tiên
	sqlTrimmed := strings.TrimSpace(req.SQL)
	upperSQL := strings.ToUpper(sqlTrimmed)

	var result *model.TDQueryResult

	if strings.HasPrefix(upperSQL, "SELECT") ||
		strings.HasPrefix(upperSQL, "WITH") ||
		strings.HasPrefix(upperSQL, "EXPLAIN") ||
		strings.HasPrefix(upperSQL, "SHOW") ||
		strings.HasPrefix(upperSQL, "TABLE") {
		result, err = database.ExecutePostgreSQLQuery(conn.ConnectionString, req.SQL)
	} else {
		result, err = database.ExecutePostgreSQLNonQuery(conn.ConnectionString, req.SQL)
	}

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": err.Error(),
			"data":    nil,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    result,
	})
}

// TestPostgreSQLConnectionHandler nhận connection_string từ client và thử kết nối
func TestPostgreSQLConnectionHandler(w http.ResponseWriter, r *http.Request) {
	var req model.TDTestPostgeSQLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.ConnectionString == "" {
		http.Error(w, "connection_string là bắt buộc", http.StatusBadRequest)
		return
	}

	// Thử thực thi câu query đơn giản SELECT 1
	_, err := database.ExecutePostgreSQLQuery(req.ConnectionString, "SELECT 1 LIMIT 1;")

	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Kết nối thành công!",
	})
}
