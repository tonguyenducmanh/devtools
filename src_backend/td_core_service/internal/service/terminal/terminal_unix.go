//go:build !windows
// file này chỉ build trên hệ điều hành không phải windows (Linux, macOS)
package terminal

import (
	"os"
	"td_core_service/internal/model"
	"td_core_service/td_common"

	gopty "github.com/aymanbagabas/go-pty"
)

// hệ unix chưa có nhu cầu custom
func AppendOSEnv(baseEnv []string, req model.CreateTerminalRequest, c *gopty.Cmd, pty gopty.Pty) ([]string, *gopty.Cmd) {
	return baseEnv, c
}

// thêm các command có sẵn theo hệ điều hành
func AppendOSCommand() []model.ShellOption {
	var shells []model.ShellOption
	// Danh sách các shell muốn hỗ trợ trên Linux/macOS
	allLinuxShells := []model.ShellOption{
		{Name: "Zsh", Path: "zsh"},
		{Name: "Bash", Path: "bash"},
		{Name: "Sh", Path: "sh"},
	}

	// Chỉ quét và thêm những shell thực sự có trên máy Ubuntu/Linux đó
	for _, shell := range allLinuxShells {
		if td_common.IsCommandAvailable(shell.Path) {
			shells = append(shells, shell)
		}
	}
	return shells
}

// xóa tiến trình
func KillProcess(proc *os.Process) {
	_ = proc.Kill()
}
