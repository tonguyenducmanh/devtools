package service

import (
	"fmt"
	"net/http"
)

/**
 * kiểm tra service có sống không
 */
func HeathCheck(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "API service is ready")
}
