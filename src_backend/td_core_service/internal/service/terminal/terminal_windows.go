//go:build windows

package terminal

import (
	"syscall"

	gopty "github.com/aymanbagabas/go-pty"
)

// Định nghĩa hằng số Windows chính xác
const (
	WINDOWS_ACTUAL_NEW_PROCESS_GROUP = 0x00000010
	CREATE_NO_WINDOW                 = 0x08000000 // Ép buộc không tạo cửa sổ Console hiển thị
)

// Hàm bổ sung thuộc tính độc lập cho Windows
func ConfigureSysProcAttr(c *gopty.Cmd) {
	if c.SysProcAttr == nil {
		c.SysProcAttr = &syscall.SysProcAttr{}
	}

	// 1. Kết hợp các thuộc tính CreationFlags:
	// - syscall.CREATE_NEW_PROCESS_GROUP (0x200): Breakaway khỏi Job mẹ để khi taskkill không chết lây app Go.
	// - WINDOWS_ACTUAL_NEW_PROCESS_GROUP (0x10): Tạo Group riêng cho Terminal.
	// - CREATE_NO_WINDOW (0x08000000): Chặn Windows tự động bật cửa sổ cmd/powershell mới lên màn hình.
	c.SysProcAttr.CreationFlags |= syscall.CREATE_NEW_PROCESS_GROUP | WINDOWS_ACTUAL_NEW_PROCESS_GROUP | CREATE_NO_WINDOW

	// 2. Ẩn cửa sổ ở mức độ Window GUI
	c.SysProcAttr.HideWindow = true
}
