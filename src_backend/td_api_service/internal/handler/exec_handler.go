package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"td_api_service/internal/service"
	"td_api_service/model"
)

func ExecHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	var uiReq model.UIRequest
	if err := json.NewDecoder(r.Body).Decode(&uiReq); err != nil {
		_ = json.NewEncoder(w).Encode(model.APIResponse{
			Status:     500,
			StatusText: "ERROR",
			Body:       err.Error(),
		})
		return
	}

	log.Println("=== API REQUEST ===")
	log.Println("Method:", uiReq.HttpMethod)
	log.Println("URL:", uiReq.ApiURL)

	resp, err := service.Execute(r.Context(), uiReq)
	if err != nil {
		_ = json.NewEncoder(w).Encode(model.APIResponse{
			Status:     500,
			StatusText: "ERROR",
			Body:       err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}
