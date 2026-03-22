package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject RDP WebSocket proxy route
func InjectRDPRouter(app *http.ServeMux) {
	app.HandleFunc("GET /rdp/ws", service.HandleRDPWebSocket)
}
