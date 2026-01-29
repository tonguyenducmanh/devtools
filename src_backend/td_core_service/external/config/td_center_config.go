package config

/**
 * kiểu dữ liệu config chung
 */
type TDCenterConfig struct {
	APIConfig     APIConfig     `json:"api_config"`
	WebConfig     WebConfig     `json:"web_config"`
	MockAPIConfig MockAPIConfig `json:"mock_api_config"`
	DatabaseName  string        `json:"database_name"`
}

type APIConfig struct {
	Port        int  `json:"port"`
	EnableTrace bool `json:"enable_trace"`
}

type WebConfig struct {
	Port        int  `json:"port"`
	EnableTrace bool `json:"enable_trace"`
}

type MockAPIConfig struct {
	Port        int  `json:"port"`
	EnableTrace bool `json:"enable_trace"`
}

/**
 * apply giá trị default
 */
func DefaultConfig() TDCenterConfig {
	return TDCenterConfig{
		APIConfig: APIConfig{
			Port:        7777,
			EnableTrace: false,
		},
		WebConfig: WebConfig{
			Port:        1403,
			EnableTrace: false,
		},
		MockAPIConfig: MockAPIConfig{
			Port:        8888,
			EnableTrace: false,
		},
		DatabaseName: "tool_tomanh.db",
	}
}
