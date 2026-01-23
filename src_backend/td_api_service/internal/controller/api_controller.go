package controller

import (
	"net/http"
	"td_api_service/internal/model"
	"td_api_service/internal/service"

	"github.com/gin-gonic/gin"
)

type APIController struct {
	svc service.APITestService
}

func NewAPIController(svc service.APITestService) *APIController {
	return &APIController{svc: svc}
}

func (c *APIController) Execute(ctx *gin.Context) {
	var req model.ExecuteRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Dữ liệu không hợp lệ"})
		return
	}

	result, err := c.svc.ExecuteRequest(req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}
