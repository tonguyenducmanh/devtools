package td_common

import (
	"fmt"
	"strings"
	"td_core_service/internal/database"
	"td_core_service/internal/model"
	"time"
)

// hàm log common của toàn chương trình
func LogData(message string, level string) {
	t := time.Now()
	sub_fix := "\n"
	if !strings.HasSuffix(message, sub_fix) {
		message += sub_fix
	}

	levelLogName := "Log " + level

	// Định dạng: Ngày/Tháng/Năm Giờ:Phút:Giây
	fmt.Printf("[%s] %s: %s", t.Format("02/01/2006 15:04:05"), levelLogName, message)

	// log vào db
	dataLogDB := model.TDLogApp{
		ID: GenUUID(), Level: level, LogData: message,
	}
	database.CreateLogApp(&dataLogDB)
}

func LogInfo(message string) {
	LogData(message, "info")
}
