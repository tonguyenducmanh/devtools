// Package duckdb chứa tầng service cho DuckDB Query Tool.
// Handler thực thi SQL query trên 1 session DuckDB in-memory.

package duckdb

import (
	"encoding/json"
	"fmt"
	"net/http"

	duckdb "tm_core_service/internal/database/duckdb"
	"tm_core_service/internal/model"
	"tm_core_service/tm_common"
)

// ExecuteDuckDBQueryHandler nhận session_id + sql, thực thi trên in-memory DuckDB,
// trả về danh sách kết quả cùng shape với PostgreSQL tool.
//
// POST /duckdb/execute_query
// Body: { "session_id": "...", "sql": "...", "default_limit": 1000, "unlimited": false }
func ExecuteDuckDBQueryHandler(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if rec := recover(); rec != nil {
			tm_common.LogError(fmt.Sprintf("PANIC in ExecuteDuckDBQueryHandler: %v", rec))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": fmt.Sprintf("Internal server error: %v", rec),
			})
		}
	}()

	var req model.TMDuckDBQueryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if req.SessionID == "" {
		http.Error(w, "session_id là bắt buộc", http.StatusBadRequest)
		return
	}
	if req.SQL == "" {
		http.Error(w, "sql là bắt buộc", http.StatusBadRequest)
		return
	}

	result, err := duckdb.ExecuteQuery(req.SessionID, req.SQL, req.DefaultLimit, req.Unlimited)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err != nil {
		if encodeErr := json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": err.Error(),
			"data":    result,
		}); encodeErr != nil {
			tm_common.LogError(fmt.Sprintf("Lỗi encode JSON (error case): %v", encodeErr))
		}
		return
	}

	if encodeErr := json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    result,
	}); encodeErr != nil {
		tm_common.LogError(fmt.Sprintf("Lỗi encode JSON (success case): %v", encodeErr))
	}
}
