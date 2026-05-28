//go:build windows

package terminal

import (
	"syscall"

	gopty "github.com/aymanbagabas/go-pty"
)

// Hàm bổ sung thuộc tính độc lập cho Windows
func ConfigureSysProcAttr(c *gopty.Cmd) {
	if c.SysProcAttr == nil {
		c.SysProcAttr = &syscall.SysProcAttr{}
	}
	c.SysProcAttr.CreationFlags = syscall.CREATE_NEW_PROCESS_GROUP
}
