// main.go
package web_app

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"path/filepath"
	"strings"
)

//go:embed all:dist
var embeddedFiles embed.FS

func RunWebApp() {
	// Create a sub-filesystem from the embedded "dist" directory
	publicFS, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Log all embedded files for debugging
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

	// Wrap the file server with SPA handler
	http.Handle("/", spaHandler(publicFS))

	// Start the HTTP server
	port := ":8080"
	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}

// spaHandler wraps the file server to handle SPA routing
func spaHandler(fsys fs.FS) http.HandlerFunc {
	fileServer := http.FileServer(http.FS(fsys))

	return func(w http.ResponseWriter, r *http.Request) {
		// Get the path from the request
		path := r.URL.Path

		// Remove leading slash for fs operations
		cleanPath := strings.TrimPrefix(path, "/")
		if cleanPath == "" {
			cleanPath = "index.html"
		}

		// Log the request
		fmt.Printf("Request: %s -> Checking: %s\n", path, cleanPath)

		// Check if the file exists
		if file, err := fsys.Open(cleanPath); err == nil {
			file.Close()
			fmt.Printf("  ✓ File exists, serving: %s\n", cleanPath)
			// File exists, serve it normally
			fileServer.ServeHTTP(w, r)
			return
		} else {
			fmt.Printf("  ✗ File not found: %s (error: %v)\n", cleanPath, err)
		}

		// Check if it's a request for a static asset (has file extension)
		if hasFileExtension(path) {
			// If it's supposed to be a file but doesn't exist, return 404
			fmt.Printf("  → Returning 404 for missing file: %s\n", path)
			http.NotFound(w, r)
			return
		}

		// No file exists and no extension, serve index.html for SPA routing
		fmt.Printf("  → Serving index.html for SPA route: %s\n", path)
		indexFile, err := fsys.Open("index.html")
		if err != nil {
			http.Error(w, "index.html not found", http.StatusNotFound)
			return
		}
		defer indexFile.Close()

		// Read and serve index.html
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
