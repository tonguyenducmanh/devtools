package td_common

import (
	"crypto/rand"
	"fmt"
	"net"
	"net/http"
	"strings"
	configGlobal "td_core_service/external/config"
	"time"
)

// GetServerIP trả về IP LAN của server
func GetServerIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}

	for _, addr := range addrs {
		if ipNet, ok := addr.(*net.IPNet); ok {
			ip := ipNet.IP

			// bỏ qua IPv6
			if ip.To4() == nil {
				continue
			}

			// nếu là localhost → trả về localhost
			if ip.IsLoopback() {
				return "localhost"
			}

			// IP LAN hợp lệ
			return ip.String()
		}
	}

	return "localhost"
}

// log ra server đang chạy
func BuildRunningAddressServer(server_name string, port *int) string {
	addr := fmt.Sprintf("%d", *port)
	server := GetServerIP()
	log_message := fmt.Sprintf("%s đang chạy tại http://%s:%s\n", server_name, server, addr)
	LogInfo(log_message)
	addBuildMuxServer := fmt.Sprintf(":%d", *port)
	return addBuildMuxServer
}

// Tạo UUID v4
func GenUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return ""
	}

	// Thiết lập các bit cho phiên bản 4 (v4) theo RFC 4122
	// 1. Thiết lập 4 bit cao của byte thứ 7 thành 0100 (v4)
	b[6] = (b[6] & 0x0f) | 0x40
	// 2. Thiết lập 2 bit cao của byte thứ 9 thành 10 (variant 1)
	b[8] = (b[8] & 0x3f) | 0x80

	return fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// hàm log common của toàn chương trình
func LogInfo(message string) {
	t := time.Now()
	sub_fix := "\n"
	if !strings.HasSuffix(message, sub_fix) {
		message += sub_fix
	}
	// Định dạng: Ngày/Tháng/Năm Giờ:Phút:Giây
	fmt.Printf("[%s] %s", t.Format("02/01/2006 15:04:05"), message)
}

// build ra hanlder api common
func BuildHanlderAPICommon(app *http.ServeMux) http.HandlerFunc {
	var handler http.HandlerFunc = nil

	// cấu hình endpoint có phân biệt hoa thường hay không
	if configGlobal.GetConfigGlobal().EndpointCaseSensitive {
		handler = app.ServeHTTP
	} else {
		handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.URL.Path = strings.ToLower(r.URL.Path)
			app.ServeHTTP(w, r)
		})
	}
	return handler
}
