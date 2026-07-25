package router

import (
	"net/http"
	"td_core_service/internal/service"
)

// InjectFileOpsRouter inject các route liên quan đến thao tác file
func InjectFileOpsRouter(app *http.ServeMux) {
	app.HandleFunc("POST /file_ops/read_file", service.ReadFileHandler)
	app.HandleFunc("POST /file_ops/read_folder", service.ReadFolderHandler)
	app.HandleFunc("POST /file_ops/write_file", service.WriteFileHandler)
}
