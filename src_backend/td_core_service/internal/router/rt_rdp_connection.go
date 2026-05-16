package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject các router liên quan đến RDP Connection
func InjectRDPConnectionRouter(app *http.ServeMux) {
	service.GetRDPConnectionController().RegisterRoutes(app)
}
