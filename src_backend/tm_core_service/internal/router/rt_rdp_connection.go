package router

import (
	"net/http"
	"tm_core_service/internal/service"
)

// Inject các router liên quan đến RDP Connection
func InjectRDPConnectionRouter(app *http.ServeMux) {
	service.GetRDPConnectionCollection().RegisterRoutes(app)
}
