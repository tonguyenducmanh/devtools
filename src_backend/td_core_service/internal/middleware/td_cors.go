package middleware

import (
	"net/http"
	"td_core_service/td_common"
)

// middleware cors cho phép gọi từ mọi nơi
func ApplyCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		td_common.BypassCORSConfig(w)

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
