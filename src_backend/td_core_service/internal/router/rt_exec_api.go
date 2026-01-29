package router

import (
	"net/http"
	"td_core_service/internal/service"
)

/**
 * Inject các router liên quan đến thực thi API (gọi nối)
 */
func InjectExecAPIRouter(app *http.ServeMux) {
	app.HandleFunc("POST /exec", service.Execute)
}
