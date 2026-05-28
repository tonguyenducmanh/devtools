package td_config

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
	// tên database của app
	DatabaseName string `json:"database_name"`
	// endpoint của api có phân biệt hoa thường không
	EndpointCaseSensitive bool `json:"endpoint_case_sensitive"`
	// show địa chỉ ip server thay vì local host
	ShowIPServer   bool           `json:"show_ip_server"`
	TerminalConfig TerminalConfig `json:"terminal_config"`
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

type TerminalConfig struct {
	// dung lượng bộ nhớ tối đa tính bằng kb
	MaxHistorySizeInKB int `json:"max_history_size_in_kb"`
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
			LevelLog:   []string{"info"},
		},
		WebConfig: WebConfig{
			Port:   1403,
			Enable: true,
		},
		MockAPIConfig: MockAPIConfig{
			Port:                  8888,
			EnableMockNotCareBody: true,
		},
		DatabaseName:          "dev_tool.db",
		EndpointCaseSensitive: false,
		ShowIPServer:          false,
		TerminalConfig: TerminalConfig{
			MaxHistorySizeInKB: 102400, // chỉ lưu 10mb default cho nhẹ
		},
	}
}
