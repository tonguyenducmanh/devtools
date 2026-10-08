package router

import (
	"net/http"
	"tm_core_service/internal/service"
)

// Inject RDP WebSocket proxy route
func InjectRDPRouter(app *http.ServeMux) {
	app.HandleFunc("GET /rdp/ws", service.HandleRDPWebSocket)
}
