package config

// kiểu dữ liệu config chung
type TDCenterConfig struct {
	// cấu hình api chung của app backend
	APIConfig APIConfig `json:"api_config"`
	// cấu hình UI web server
	WebConfig WebConfig `json:"web_config"`
	// cấu hình mock api server
	MockAPIConfig MockAPIConfig `json:"mock_api_config"`
	// tên database của app
	DatabaseName string `json:"database_name"`
	// endpoint của api có phân biệt hoa thường không
	EndpointCaseSensitive bool `json:"endpoint_case_sensitive"`
	// show địa chỉ ip server thay vì local host
	ShowIPServer bool `json:"show_ip_server"`
}

type APIConfig struct {
	Port        int  `json:"port"`
	Enable      bool `json:"enable"`
	EnableTrace bool `json:"enable_trace"`
}

type WebConfig struct {
	Port        int  `json:"port"`
	Enable      bool `json:"enable"`
	EnableTrace bool `json:"enable_trace"`
}

type MockAPIConfig struct {
	Port        int  `json:"port"`
	EnableTrace bool `json:"enable_trace"`
}

// apply giá trị default
func DefaultConfig() TDCenterConfig {
	return TDCenterConfig{
		APIConfig: APIConfig{
			Port:        7777,
			Enable:      true,
			EnableTrace: false,
		},
		WebConfig: WebConfig{
			Port:        1403,
			Enable:      true,
			EnableTrace: false,
		},
		MockAPIConfig: MockAPIConfig{
			Port:        8888,
			EnableTrace: false,
		},
		DatabaseName:          "dev_tool.db",
		EndpointCaseSensitive: false,
		ShowIPServer:          false,
	}
}
