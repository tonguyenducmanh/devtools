package router

import (
	"net/http"
	rdp "td_core_service/internal/rdp"
)

// Inject RDP WebSocket proxy route
func InjectRDPRouter(app *http.ServeMux) {
	app.HandleFunc("GET /rdp/ws", rdp.HandleRDPWebSocket)
}
