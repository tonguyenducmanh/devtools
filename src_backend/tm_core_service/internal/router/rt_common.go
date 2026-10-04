package router

import (
	"net/http"
	"tm_core_service/internal/service"
)

// Inject các router chung
func InjectCommonRouter(app *http.ServeMux) {
	app.HandleFunc("GET /{$}", service.HeathCheck)
}
