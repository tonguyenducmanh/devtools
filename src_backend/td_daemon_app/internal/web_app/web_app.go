// main.go
package web_app

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed dist
var embeddedFiles embed.FS

func RunWebApp() {
	// Create a sub-filesystem from the embedded "public" directory.
	// This is important if your HTML directly references assets like /css/style.css
	// and you want the root of your HTTP server to align with the root of embedded files.
	// Otherwise, paths like /public/css/style.css would be required.
	publicFS, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	// Create an HTTP file server from the embedded file system
	http.Handle("/", http.FileServer(http.FS(publicFS)))

	// Start the HTTP server
	port := ":8080"
	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
