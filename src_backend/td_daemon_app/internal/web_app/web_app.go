package web_app

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
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
	dist, err := fs.Sub(distFS, "../../frontend/dist")
	if err != nil {
		log.Fatal(err)
	}

	fileServer := http.FileServer(http.FS(dist))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// SPA fallback: nếu không có file → trả index.html
		_, err := dist.Open(r.URL.Path[1:])
		if err != nil {
			r.URL.Path = "/index.html"
		}
		fileServer.ServeHTTP(w, r)
	})
	addr := fmt.Sprintf(":%d", *api_port)

	log.Println("Web app running at http://localhost" + addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
