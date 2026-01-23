package middleware

import (
	"log"
	"net/http"
	"time"
)

// Middleware bọc lấy Handler chuẩn
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[TOMANH-API] %s %s | %v", r.Method, r.URL.Path, time.Since(start))
	})
}
