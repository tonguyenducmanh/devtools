package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// Inject các router liên quan đến Bilingual Web
func InjectBilingualWebRouter(app *http.ServeMux) {
	app.HandleFunc("POST /bilingual_web/fetch", service.FetchBilingualWeb)
	app.HandleFunc("POST /bilingual_web/translate", service.TranslateTextBatch)
}
