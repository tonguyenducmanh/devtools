package td_config

import "time"

// kiểu dữ liệu config chung
type TDCenterConfig struct {
	// cấu hình api chung của app backend
	APIConfig APIConfig `json:"api_config"`
	// cấu hình UI web server
	WebConfig WebConfig `json:"web_config"`
	// cấu hình mock api server
	MockAPIConfig MockAPIConfig `json:"mock_api_config"`
	// cấu hình log
	LogConfig LogConfig `json:"log_config"`
	// cấu hình HTTP client dùng cho API testing (gọi nối từ backend)
	HTTPClientConfig HTTPClientConfig `json:"http_client_config"`
	// tên database của app
	DatabaseName string `json:"database_name"`
	// endpoint của api có phân biệt hoa thường không
	EndpointCaseSensitive bool `json:"endpoint_case_sensitive"`
	// show địa chỉ ip server thay vì local host
	ShowIPServer bool `json:"show_ip_server"`
}

type LogConfig struct {
	LogConsole bool     `json:"log_console"`
	LevelLog   []string `json:"level_log"`
}

type APIConfig struct {
	Port   int  `json:"port"`
	Enable bool `json:"enable"`
}

type WebConfig struct {
	Port   int  `json:"port"`
	Enable bool `json:"enable"`
}

type MockAPIConfig struct {
	Port int `json:"port"`
	// api mock không quan tâm tới body, chỉ cần trùng endpoint là được
	EnableMockNotCareBody bool `json:"enable_mock_not_care_body"`
}

// HTTPClientConfig cấu hình connection pool cho Go http.Client
// Dùng chung cho API Testing (single request + parallel request)
//
// Giá trị tối ưu cho tool dev (ít traffic, cần nhanh + chịu parallel):
//   - MaxIdleConns cao → giữ nhiều connection warm, gọi lại nhanh
//   - MaxIdleConnsPerHost cao → parallel request cùng host không bị tạo connection mới
//   - Timeout vừa phải → không bị treo request quá lâu
type HTTPClientConfig struct {
	// Số connection idle tối đa giữ trong pool (default: 200)
	// Càng cao → càng nhiều connection sẵn sàng tái sử dụng, request tiếp theo nhanh hơn
	MaxIdleConns int `json:"max_idle_conns"`

	// Số connection idle tối đa giữ cho MỘT host (default: 20)
	// Quan trọng nhất cho parallel: nếu = 2 (default Go) thì gọi 3 request cùng host
	// sẽ tạo connection mới → lag. Nên đặt ≥ số request parallel max mong đợi per host.
	MaxIdleConnsPerHost int `json:"max_idle_conns_per_host"`

	// Thời gian giữ connection idle trước khi đóng (default: 120s)
	// Tool dev nên giữ lâu hơn → lần gọi sau không cần TLS handshake lại
	IdleConnTimeout time.Duration `json:"idle_conn_timeout"`

	// Timeout TLS handshake (default: 10s)
	TLSHandshakeTimeout time.Duration `json:"tls_handshake_timeout"`

	// Timeout toàn bộ 1 request từ lúc tạo đến lúc đọc xong response (default: 180s)
	// Tool dev nên để 3 phút vì một số API chậm (report, export, batch...)
	ClientTimeout time.Duration `json:"client_timeout"`
}

// apply giá trị default
func DefaultConfig() TDCenterConfig {
	return TDCenterConfig{
		APIConfig: APIConfig{
			Port:   7777,
			Enable: true,
		},
		LogConfig: LogConfig{
			LogConsole: true,
			LevelLog:   []string{"info", "debug", "error", "exception"},
		},
		WebConfig: WebConfig{
			Port:   1403,
			Enable: true,
		},
		MockAPIConfig: MockAPIConfig{
			Port:                  8888,
			EnableMockNotCareBody: true,
		},
		HTTPClientConfig: HTTPClientConfig{
			MaxIdleConns:        200,
			MaxIdleConnsPerHost: 20,
			IdleConnTimeout:     120 * time.Second,
			TLSHandshakeTimeout: 10 * time.Second,
			ClientTimeout:       180 * time.Second,
		},
		DatabaseName:          "dev_tool.db",
		EndpointCaseSensitive: false,
		ShowIPServer:          false,
	}
}
