package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"slices"
	"sync"
	"td_config"
	"td_core_service/internal/model"
	"td_core_service/td_common"
	"time"

	gopty "github.com/aymanbagabas/go-pty"
	"github.com/gorilla/websocket"
)

var maxHistorySize = td_config.GetConfigGlobal().TerminalConfig.MaxHistorySizeInKB * 1024

var (
	sessions   = make(map[string]*model.TerminalSession)
	sessionsMu sync.Mutex
)

// lấy ra các loại terminal sẵn có ứng với từng hệ điều hành
func GetAllTerminalShellsSupport(w http.ResponseWriter, r *http.Request) {
	var shells []model.ShellOption
	if runtime.GOOS == "windows" {
		shells = append(shells, model.ShellOption{Name: "PowerShell", Path: "powershell.exe"})
		shells = append(shells, model.ShellOption{Name: "CMD", Path: "cmd.exe"})
	} else {
		shells = append(shells, model.ShellOption{Name: "Zsh", Path: "zsh"})
		shells = append(shells, model.ShellOption{Name: "Bash", Path: "bash"})
		shells = append(shells, model.ShellOption{Name: "Sh", Path: "sh"})
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(shells)
}

// lấy ra các phiên terminal sẵn có
func GetActiveSessions(w http.ResponseWriter, r *http.Request) {
	sessionsMu.Lock()
	defer sessionsMu.Unlock()

	list := make([]*model.TerminalSession, 0, len(sessions))
	for _, s := range sessions {
		list = append(list, s) // Lưu trực tiếp con trỏ s, KHÔNG dùng dấu *
	}

	// Khi sắp xếp, hãy so sánh qua con trỏ
	slices.SortFunc(list, func(a, b *model.TerminalSession) int {
		return b.CreatedDateRaw.Compare(a.CreatedDateRaw)
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

// tạo 1 phiên terminal mới
func CreateTerminalSession(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req model.CreateTerminalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	pty, err := gopty.New()
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    err.Error(),
		})
		return
	}

	c := pty.Command(req.Shell)
	c.Env = append(os.Environ(), "TERM=xterm-256color", "LANG=en_US.UTF-8", "LC_ALL=en_US.UTF-8")

	if err := c.Start(); err != nil {
		pty.Close()
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    err.Error(),
		})
		return
	}

	id := td_common.GenUUID()
	current_time := time.Now()
	session := &model.TerminalSession{
		TDBaseModel: model.TDBaseModel{
			ID:          id,
			CreatedDate: current_time.Format("2006-01-02 15:04:05"),
		},
		CreatedDateRaw: current_time,
		Shell:          req.Shell,
		Name:           req.Name,
		Cmd:            c,
		PTY:            pty,
		Clients:        make(map[*websocket.Conn]bool),
		History:        make([]byte, 0, maxHistorySize),
	}

	sessionsMu.Lock()
	sessions[id] = session
	sessionsMu.Unlock()

	// Read PTY output và broadcast tới tất cả WebSocket clients
	go func() {
		defer func() {
			// Cleanup: đóng PTY, xoá session, ngắt tất cả clients
			session.PTY.Close()
			sessionsMu.Lock()
			delete(sessions, id)
			sessionsMu.Unlock()
			session.ClientsMu.Lock()
			for client := range session.Clients {
				client.Close()
			}
			session.ClientsMu.Unlock()
		}()

		buf := make([]byte, 4096)
		for {
			n, err := session.PTY.Read(buf)
			if n > 0 {
				data := buf[:n]

				session.HistoryMu.Lock()
				if len(session.History)+n > maxHistorySize {
					keep := maxHistorySize - n
					if keep <= 0 {
						session.History = data[n-maxHistorySize:]
					} else {
						start := len(session.History) - keep
						if start < 0 {
							start = 0
						}
						session.History = append(session.History[start:], data...)
					}
				} else {
					session.History = append(session.History, data...)
				}
				session.HistoryMu.Unlock()

				session.ClientsMu.Lock()
				for client := range session.Clients {
					if err := client.WriteMessage(websocket.BinaryMessage, data); err != nil {
						client.Close()
						delete(session.Clients, client)
					}
				}
				session.ClientsMu.Unlock()
			}
			if err != nil {
				if err != io.EOF {
					td_common.LogError(fmt.Sprintf("[Terminal] PTY read error: %v", err))
				}
				break
			}
		}
	}()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    session,
	})
}

// killSession dừng process và đóng PTY — dùng chung cho cả KillTerminalSession và cleanup.
// Thứ tự quan trọng:
//  1. Kill process trước → process thoát → PTY trả EOF → goroutine read tự thoát
//  2. Close PTY sau → giải phóng handle
func killSession(session *model.TerminalSession) error {
	// Bước 1: kill process
	// Cmd.Process là *os.Process trên Unix, trên Windows go-pty quản lý nội bộ.
	// Gọi qua ExecCmd() để lấy process gốc.
	if proc := session.Cmd.Process; proc != nil {
		// Bỏ qua lỗi "process already finished"
		_ = proc.Kill()
	}

	// Bước 2: đóng PTY handle — unblock goroutine Read nếu Kill chưa đủ
	return session.PTY.Close()
}

// xóa 1 phiên terminal đang chạy
func KillTerminalSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    "Session ID is required",
		})
		return
	}

	sessionsMu.Lock()
	session, exists := sessions[id]
	sessionsMu.Unlock()

	if !exists {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    "session not found",
		})
		return
	}

	if err := killSession(session); err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    "kill session success",
	})
}

// WebSocket handler for terminal
func HandleTerminalWebSocket(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "Missing session id", http.StatusBadRequest)
		return
	}

	sessionsMu.Lock()
	session, exists := sessions[id]
	sessionsMu.Unlock()

	if !exists {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		td_common.LogError(fmt.Sprintf("[Terminal] WebSocket upgrade failed: %v", err))
		return
	}
	defer ws.Close()

	session.ClientsMu.Lock()
	session.Clients[ws] = true
	session.ClientsMu.Unlock()

	// Gửi lại history cho client mới kết nối
	session.HistoryMu.Lock()
	if len(session.History) > 0 {
		ws.WriteMessage(websocket.BinaryMessage, session.History)
	}
	session.HistoryMu.Unlock()

	for {
		messageType, data, err := ws.ReadMessage()
		if err != nil {
			break
		}

		if messageType == websocket.TextMessage {
			var msg struct {
				Type string `json:"type"`
				Rows uint16 `json:"rows"`
				Cols uint16 `json:"cols"`
			}
			if err := json.Unmarshal(data, &msg); err == nil && msg.Type == "resize" {
				session.PTY.Resize(int(msg.Cols), int(msg.Rows))
				continue
			}
		}

		if len(data) > 0 {
			session.PTY.Write(data)
		}
	}

	session.ClientsMu.Lock()
	delete(session.Clients, ws)
	session.ClientsMu.Unlock()
}
