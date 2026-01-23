package web_app

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

//go:embed dist
var distFS embed.FS

/**
 * Chạy web app
 */
func RunWebApp() {
	api_port := flag.Int("web-port", 5678, "Port to run the web app")
	flag.Parse()

	// Lấy sub FS trỏ đúng vào dist
	dist, err := fs.Sub(distFS, "dist")
	if err != nil {
		log.Fatal(err)
	}

	fileServer := http.FileServer(http.FS(dist))

	http.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path[1:]
		if path == "" {
			path = "index.html"
		}

		// Kiểm tra xem file có tồn tại không
		_, err := fs.Stat(dist, path)

		if err != nil {
			// File không tồn tại
			ext := filepath.Ext(path)

			// Nếu request có extension (như .js, .css, .png, etc.)
			// → Đây là request file tĩnh thực sự → trả 404
			if ext != "" && ext != ".html" {
				http.NotFound(w, r)
				return
			}

			// Nếu không có extension hoặc là .html
			// → Có thể là SPA route → fallback về index.html
			data, readErr := fs.ReadFile(dist, "index.html")
			if readErr != nil {
				http.Error(w, "index.html not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(data)
			return
		}

		// File tồn tại → serve bình thường với MIME type đúng
		serveFileWithCorrectMIME(w, r, path, dist, fileServer)
	}))

	addr := fmt.Sprintf(":%d", *api_port)

	log.Println("Web app running at http://localhost" + addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

func serveFileWithCorrectMIME(w http.ResponseWriter, r *http.Request, path string, dist fs.FS, fileServer http.Handler) {
	// Set MIME type cho các loại file phổ biến
	ext := strings.ToLower(filepath.Ext(path))
	switch ext {
	case ".js":
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	case ".mjs":
		w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
	case ".css":
		w.Header().Set("Content-Type", "text/css; charset=utf-8")
	case ".json":
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
	case ".png":
		w.Header().Set("Content-Type", "image/png")
	case ".jpg", ".jpeg":
		w.Header().Set("Content-Type", "image/jpeg")
	case ".svg":
		w.Header().Set("Content-Type", "image/svg+xml")
	case ".wasm":
		w.Header().Set("Content-Type", "application/wasm")
	}

	fileServer.ServeHTTP(w, r)
}
