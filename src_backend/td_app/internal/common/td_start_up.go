package common

import (
	"td_app/internal/banner"
	configGlobal "td_core_service/external/config"
)

/**
 * Xử lý các kịch bản cần thiết khi run app nói chung
 */
func HandleStartUpLogic() *configGlobal.TDCenterConfig {
	centerConfig := configGlobal.GetConfigGlobal()
	banner.PrintBanner()
	return centerConfig
}
