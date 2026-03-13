package web

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"td_config"
	"td_core_service/td_common"
	"time"
)

//go:embed all:dist
var embeddedFiles embed.FS

// Chạy web app
func RunWebApp() {
	port := td_config.GetConfigGlobal().WebConfig.Port

	publicFS, err := fs.Sub(embeddedFiles, "dist")
	if err != nil {
		log.Fatal(err)
	}

	logDirectory(publicFS)

	handler := spaHandler(publicFS)

	addr := td_common.BuildRunningAddressServer("Server Web UI", &port)

	// Phải dùng goroutine để mở browser TRƯỚC khi gọi ListenAndServe,
	// vì ListenAndServe là blocking call — nó chạy vô hạn để phục vụ request
	// và không bao giờ return trong lúc server đang hoạt động bình thường.
	// Nếu đặt openBrowser() sau ListenAndServe thì sẽ không bao giờ được gọi.
	// Goroutine chờ 500ms để server kịp bind port, rồi mở browser song song.
	url := fmt.Sprintf("http://localhost:%d", port)
	go func() {
		time.Sleep(500 * time.Millisecond) // chờ server bind port xong
		openBrowser(url)
	}()

	// Blocking call: giữ server chạy và lắng nghe request cho đến khi có lỗi
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

// openBrowser mở trình duyệt mặc định, hỗ trợ Windows, macOS, Linux
func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default: // linux và các OS khác
		cmd = exec.Command("xdg-open", url)
	}
	if err := cmd.Start(); err != nil {
		td_common.LogDebug(fmt.Sprintf("Không thể mở trình duyệt tự động: %v", err))
	}
}

// log folder được dùng để run static web
func logDirectory(publicFS fs.FS) {
	td_common.LogDebug("Embedded web files:")
	fs.WalkDir(publicFS, ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		// chỉ log file, không log folder
		if !d.IsDir() {
			td_common.LogDebug(path)
		}
		return nil
	})
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
