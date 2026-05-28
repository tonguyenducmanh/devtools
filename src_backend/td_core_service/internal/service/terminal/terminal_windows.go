//go:build windows

package terminal

import (
	"syscall"

	gopty "github.com/aymanbagabas/go-pty"
)

// Vì syscall.CREATE_NEW_PROCESS_GROUP trong Go đã mang giá trị 0x200 (Breakaway),
// chúng ta tự định nghĩa hằng số mang giá trị 0x10 (Process Group thực tế của Windows)
const WINDOWS_ACTUAL_NEW_PROCESS_GROUP = 0x00000010

// Hàm bổ sung thuộc tính độc lập cho Windows
func ConfigureSysProcAttr(c *gopty.Cmd) {
	if c.SysProcAttr == nil {
		c.SysProcAttr = &syscall.SysProcAttr{}
	}

	// Kết hợp cả hai bằng toán tử |=
	// 1. syscall.CREATE_NEW_PROCESS_GROUP mang giá trị 0x200 (Windows hiểu là Breakaway khỏi Job)
	// 2. WINDOWS_ACTUAL_NEW_PROCESS_GROUP mang giá trị 0x10 (Windows hiểu là Tạo Group riêng cho Terminal)
	c.SysProcAttr.CreationFlags |= syscall.CREATE_NEW_PROCESS_GROUP | WINDOWS_ACTUAL_NEW_PROCESS_GROUP
}
