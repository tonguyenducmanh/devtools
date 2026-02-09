package core_service

import (
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
