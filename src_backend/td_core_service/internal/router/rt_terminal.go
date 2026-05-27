package router

import (
	"net/http"
	"td_core_service/internal/service"
)

func InjectTerminalRouter(app *http.ServeMux) {
	app.HandleFunc("GET /api/terminal/shells", service.GetAllTerminalShellsSupport)
	app.HandleFunc("GET /api/terminal/sessions", service.GetActiveSessions)
	app.HandleFunc("POST /api/terminal/session", service.CreateTerminalSession)
	app.HandleFunc("DELETE /api/terminal/session/{id}", service.KillTerminalSession)
	app.HandleFunc("GET /api/terminal/ws/{id}", service.HandleTerminalWebSocket)
}
