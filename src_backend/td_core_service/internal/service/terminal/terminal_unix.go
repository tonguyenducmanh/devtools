//go:build !windows

package terminal

import (
	"syscall"

	gopty "github.com/aymanbagabas/go-pty"
)

// Trên Linux/macOS không có CreationFlags, ta dùng Setpgid để tạo Process Group mới nếu cần
func ConfigureSysProcAttr(c *gopty.Cmd) {
	if c.SysProcAttr == nil {
		c.SysProcAttr = &syscall.SysProcAttr{}
	}
	// Tạo process group độc lập trên Unix
	c.SysProcAttr.Setpgid = true
}
