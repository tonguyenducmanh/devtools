package config

/**
 * kiểu dữ liệu config chung
 */
type TDCenterConfig struct {
	APIConfig APIConfig `json:"api_config"`
	WebConfig WebConfig `json:"web_config"`
}

type APIConfig struct {
	Port        int  `json:"port"`
	EnableTrace bool `json:"enable_trace"`
}

type WebConfig struct {
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
	}
}
