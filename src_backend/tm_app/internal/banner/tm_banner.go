package banner

import (
	"tm_core_service/tm_common"
)

const banner = "Dev Tools started - From TDManh with luv"

func PrintBanner() {
	tm_common.LogInfo(banner)
}
