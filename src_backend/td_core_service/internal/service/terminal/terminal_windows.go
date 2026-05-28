//go:build windows

// file này chỉ build trên hệ điều hành windows
package terminal

import (
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"td_core_service/internal/model"
	"td_core_service/td_common"

	gopty "github.com/aymanbagabas/go-pty"
)

// Hàm bổ sung thuộc tính độc lập cho Windows
func configureSysProcAttr(c *gopty.Cmd) {
	if c.SysProcAttr == nil {
		c.SysProcAttr = &syscall.SysProcAttr{}
	}

	c.SysProcAttr.CreationFlags |= syscall.CREATE_NEW_PROCESS_GROUP

	// 2. Ẩn cửa sổ ở mức độ Window GUI
	c.SysProcAttr.HideWindow = true
}

func AppendOSEnv(baseEnv []string, req model.CreateTerminalRequest, c *gopty.Cmd, pty gopty.Pty) ([]string, *gopty.Cmd) {
	// PYTHONUTF8, PYTHONIOENCODING phòng khi shell gọi python
	baseEnv = append(baseEnv, "PYTHONUTF8=1", "PYTHONIOENCODING=utf-8")

	switch req.Shell {
	case "powershell.exe":
		// Với PowerShell: thêm args để set output encoding UTF-8 ngay khi khởi động
		c = pty.Command(req.Shell,
			"-NoExit",
			"-Command",
			"[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; [Console]::InputEncoding=[System.Text.Encoding]::UTF8; chcp 65001 | Out-Null",
		)

	case "cmd.exe":
		// CMD: chạy chcp 65001 rồi mới vào interactive mode
		c = pty.Command(req.Shell, "/k", "chcp 65001")

	default:
		// Các shell khác: giữ nguyên cách khởi tạo mặc định
		c = pty.Command(req.Shell)
	}

	configureSysProcAttr(c)
	return baseEnv, c
}

// thêm các command có sẵn theo hệ điều hành
func AppendOSCommand() []model.ShellOption {
	var shells []model.ShellOption
	if td_common.IsCommandAvailable("powershell.exe") {
		shells = append(shells, model.ShellOption{Name: "PowerShell", Path: "powershell.exe"})
	}
	if td_common.IsCommandAvailable("cmd.exe") {
		shells = append(shells, model.ShellOption{Name: "CMD", Path: "cmd.exe"})
	}
	return shells
}

// xóa tiến trình
func KillProcess(proc *os.Process) {
	cmd := exec.Command("taskkill", "/F", "/T", "/PID", fmt.Sprintf("%d", proc.Pid))
	_ = cmd.Run()
}
