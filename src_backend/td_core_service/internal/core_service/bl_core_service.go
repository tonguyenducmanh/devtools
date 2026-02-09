package core_service

import (
	"crypto/rand"
	"fmt"
	"net"
)

// GetLocalIP trả về địa chỉ IP nội bộ đầu tiên mà nó tìm thấy
func GetLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}
	for _, address := range addrs {
		// Kiểm tra xem nó có phải là một IP network không
		if ipnet, ok := address.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			// Kiểm tra nếu là IPv4
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}
	return "localhost"
}

/**
 * log ra server đang chạy
 */
func BuildRunningAddressServer(server_name string, port *int) string {
	addr := fmt.Sprintf("%d", *port)
	server := GetLocalIP()
	fmt.Printf("%s đang chạy tại http://%s:%s\n", server_name, server, addr)
	addBuildMuxServer := fmt.Sprintf(":%d", *port)
	return addBuildMuxServer
}

/**
 * Tạo UUID v4
 */
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
