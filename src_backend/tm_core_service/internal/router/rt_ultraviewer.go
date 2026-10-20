package router

import (
	"net/http"
	"tm_core_service/internal/service"
)

// Inject UltraViewer WebSocket proxy route.
// Phần giao thức UltraViewer nằm ở module WASM (src_wasm/ultraviewer), daemon
// chỉ làm trung gian mở TCP + TLS tới relay rồi chuyển byte hai chiều.
func InjectUltraViewerRouter(app *http.ServeMux) {
	app.HandleFunc("GET /ultraviewer/ws", service.HandleUltraViewerWebSocket)
}
