package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject các router liên quan đến RDP Connection
func InjectRDPConnectionRouter(app *http.ServeMux) {
	app.HandleFunc("POST /rdp_connection/create", service.CreateRDPConnection)
	app.HandleFunc("GET /rdp_connection/get_all", service.GetAllRDPConnections)
	app.HandleFunc("PUT /rdp_connection/update", service.UpdateRDPConnection)
	app.HandleFunc("DELETE /rdp_connection/delete", service.DeleteRDPConnection)
}
