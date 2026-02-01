package router

import (
	"net/http"
	"td_core_service/internal/service"
)

/**
 * Inject các router liên quan đến xem dữ liệu ứng dụng
 */
func InjectAppDataMiner(app *http.ServeMux) {
	app.HandleFunc("GET /data_miner/get_all_data", service.GetAllTableInDatabase)
}
