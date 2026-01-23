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

//go:embed all:dist
var embeddedFiles embed.FS

/**
 * Chạy web app
 */
func RunWebApp() {
	// Web flags
	port := flag.Int("web-port", 8080, "Port cho Web server")
	trace := flag.Bool("web-trace", false, "Hiển thị log chi tiết cho Web server")
	flag.Parse()

	publicFS, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	logDirectory(trace, publicFS)

	handler := spaHandler(publicFS)

	addr := fmt.Sprintf(":%d", *port)
	fmt.Printf("Server Web đang chạy tại http://localhost%s\n", addr)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

/**
 * log folder được dùng để run static web
 */
func logDirectory(trace *bool, publicFS fs.FS) {
	if *trace {
		fmt.Println("Embedded files:")
		fs.WalkDir(publicFS, ".", func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			// chỉ log file, không log folder
			if !d.IsDir() {
				fmt.Printf("  - %s\n", path)
			}
			return nil
		})
	}
}

/**
 * hàm handler xử lý single page application
 */
func spaHandler(fsys fs.FS) http.HandlerFunc {
	fileServer := http.FileServer(http.FS(fsys))

	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		cleanPath := strings.TrimPrefix(path, "/")

		if cleanPath == "" {
			cleanPath = "index.html"
		}

		// Check if the file exists
		if file, err := fsys.Open(cleanPath); err == nil {
			file.Close()
			fileServer.ServeHTTP(w, r)
			return
		}

		// Check if it's a request for a static asset (has file extension)
		if hasFileExtension(path) {
			http.NotFound(w, r)
			return
		}

		indexFile, err := fsys.Open("index.html")
		if err != nil {
			http.Error(w, "index.html not found", http.StatusNotFound)
			return
		}
		defer indexFile.Close()

		stat, err := indexFile.Stat()
		if err != nil {
			http.Error(w, "Could not read index.html", http.StatusInternalServerError)
			return
		}

		content := make([]byte, stat.Size())
		_, err = indexFile.Read(content)
		if err != nil {
			http.Error(w, "Could not read index.html", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		w.Write(content)
	}
}

/**
 * kiểm tra xem có extension ở path không
 */
func hasFileExtension(path string) bool {
	ext := filepath.Ext(path)
	return ext != ""
}
