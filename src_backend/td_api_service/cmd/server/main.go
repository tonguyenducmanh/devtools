package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"td_api_service/internal/handler"
)

func main() {
	// ===== Parse flags =====
	port := flag.Int("port", 7777, "port to run server on")
	flag.Parse()

	addr := fmt.Sprintf("127.0.0.1:%d", *port)

	// ===== Logging =====
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Println("Agent running at http://" + addr)

	// ===== Routes =====
	http.HandleFunc("/exec", handler.ExecHandler)

	// ===== Start server =====
	log.Fatal(http.ListenAndServe(addr, nil))
}
