package main

import (
	"log"
	"net/http"

	"td_api_service/internal/handler"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)

	log.Println("Agent running at http://127.0.0.1:7777")

	http.HandleFunc("/exec", handler.ExecHandler)
	log.Fatal(http.ListenAndServe("127.0.0.1:7777", nil))
}
