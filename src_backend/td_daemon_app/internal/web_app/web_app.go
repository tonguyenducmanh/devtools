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
	"time"
)

//go:embed all:dist
var embeddedFiles embed.FS

func RunWebApp() {
	// Web flags
	port := flag.Int("web-port", 8080, "Port cho Web server")
	trace := flag.Bool("web-trace", false, "Hiển thị log chi tiết cho Web server")
	flag.Parse()
	// Create a sub-filesystem from the embedded "dist" directory
	publicFS, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Log all embedded files for debugging if trace is enabled
	if *trace {
		fmt.Println("Embedded files:")
		fs.WalkDir(publicFS, ".", func(path string, d fs.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if !d.IsDir() {
				fmt.Printf("  - %s\n", path)
			}
			return nil
		})
	}

	// Wrap the file server with SPA handler
	handler := spaHandler(publicFS, trace)

	// Start the HTTP server
	addr := fmt.Sprintf(":%d", *port)
	fmt.Printf("Server Web đang chạy tại http://localhost%s\n", addr)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

// spaHandler wraps the file server to handle SPA routing
func spaHandler(fsys fs.FS, trace *bool) http.HandlerFunc {
	fileServer := http.FileServer(http.FS(fsys))

	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		path := r.URL.Path
		cleanPath := strings.TrimPrefix(path, "/")

		if cleanPath == "" {
			cleanPath = "index.html"
		}

		// Log request if trace is enabled
		if *trace {
			defer func() {
				duration := time.Since(start)
				fmt.Printf("[%s] %s - %v\n", r.Method, path, duration)
			}()
		}

		// Check if the file exists
		if file, err := fsys.Open(cleanPath); err == nil {
			file.Close()
			if *trace {
				fmt.Printf("  ✓ Serving file: %s\n", cleanPath)
			}
			fileServer.ServeHTTP(w, r)
			return
		}

		// Check if it's a request for a static asset (has file extension)
		if hasFileExtension(path) {
			if *trace {
				fmt.Printf("  ✗ File not found (404): %s\n", cleanPath)
			}
			http.NotFound(w, r)
			return
		}

		// No file exists and no extension, serve index.html for SPA routing
		if *trace {
			fmt.Printf("  → SPA routing: serving index.html for %s\n", path)
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

// hasFileExtension checks if the path has a file extension
func hasFileExtension(path string) bool {
	ext := filepath.Ext(path)
	return ext != ""
}
