package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"td_core_service/internal/model"
	"td_core_service/td_common"
)

// ExecuteParallel thực thi nhiều request HTTP đồng thời bằng goroutines
func ExecuteParallel(w http.ResponseWriter, r *http.Request) {
	var param model.TDAPITestingParallelParam

	if err := json.NewDecoder(r.Body).Decode(&param); err != nil {
		td_common.LogError(fmt.Sprintf("ExecuteParallel - Dữ liệu không hợp lệ: %v", err))
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	if len(param.Requests) == 0 {
		http.Error(w, "Không có request nào", http.StatusBadRequest)
		return
	}

	startTime := time.Now()

	results := make([]model.TDAPITestingResponse, len(param.Requests))
	var wg sync.WaitGroup

	for i, req := range param.Requests {
		wg.Add(1)
		go func(index int, reqData model.TDAPITestingParam) {
			defer wg.Done()

			result, err := executeRequest(reqData)
			if err != nil {
				td_common.LogError(fmt.Sprintf("ExecuteParallel - Request[%d] thất bại: %v", index, err))
				results[index] = model.TDAPITestingResponse{
					Status: 599,
					Body:   fmt.Sprintf(`{"error": "%s"}`, err.Error()),
				}
				return
			}
			results[index] = *result
		}(i, req)
	}

	wg.Wait()

	totalTime := time.Since(startTime).Milliseconds()

	response := model.TDAPITestingParallelResponse{
		Results:     results,
		TotalTimeMs: totalTime,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
