package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type responseRecorder struct {
	http.ResponseWriter
	body *bytes.Buffer
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

// Pretty JSON nếu parse được
func prettyJSON(data []byte) string {
	var out bytes.Buffer
	if json.Valid(data) {
		_ = json.Indent(&out, data, "", "  ")
		return out.String()
	}
	return string(data)
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// ==== Read & restore request body ====
		var reqBody []byte
		if r.Body != nil {
			reqBody, _ = io.ReadAll(r.Body)
			r.Body = io.NopCloser(bytes.NewBuffer(reqBody))
		}

		// ==== Wrap response writer ====
		recorder := &responseRecorder{
			ResponseWriter: w,
			body:           bytes.NewBuffer(nil),
		}

		// ==== Handle request ====
		next.ServeHTTP(recorder, r)

		duration := time.Since(start)

		// ==== Log request ====
		if len(reqBody) > 0 && strings.Contains(r.Header.Get("Content-Type"), "application/json") {
			log.Printf(
				"\n[TOMANH-API] REQUEST %s %s (%v)\n%s\n",
				r.Method,
				r.URL.Path,
				duration,
				prettyJSON(reqBody),
			)
		} else {
			log.Printf(
				"\n[TOMANH-API] REQUEST %s %s (%v)\n%s\n",
				r.Method,
				r.URL.Path,
				duration,
				string(reqBody),
			)
		}

		// ==== Log response ====
		respBody := recorder.body.Bytes()
		if len(respBody) > 0 {
			log.Printf(
				"\n[TOMANH-API] RESPONSE %s %s\n%s\n",
				r.Method,
				r.URL.Path,
				prettyJSON(respBody),
			)
		}
	})
}
