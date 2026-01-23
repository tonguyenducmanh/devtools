package controller

import (
	"encoding/json"
	"net/http"
	"td_api_service/internal/model"
	"td_api_service/internal/service"
)

type APIController struct {
	svc service.APITestService
}

func NewAPIController(svc service.APITestService) *APIController {
	return &APIController{svc: svc}
}

func (c *APIController) Execute(w http.ResponseWriter, r *http.Request) {
	var req model.ExecuteRequest

	// Thay thế binding của Gin bằng json.Decoder
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Dữ liệu không hợp lệ", http.StatusBadRequest)
		return
	}

	result, err := c.svc.ExecuteRequest(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
