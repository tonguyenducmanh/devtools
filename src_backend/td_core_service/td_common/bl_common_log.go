package td_common

import (
	"fmt"
	"strings"
	"time"
)

// hàm log common của toàn chương trình
func LogInfo(message string) {
	t := time.Now()
	sub_fix := "\n"
	if !strings.HasSuffix(message, sub_fix) {
		message += sub_fix
	}
	// Định dạng: Ngày/Tháng/Năm Giờ:Phút:Giây
	fmt.Printf("[%s] %s", t.Format("02/01/2006 15:04:05"), message)
}
