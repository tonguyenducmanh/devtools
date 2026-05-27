package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"td_config"
	"td_core_service/internal/model"
	"td_core_service/td_common"

	"github.com/creack/pty"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var maxHistorySize = td_config.GetConfigGlobal().TerminalConfig.MaxHistorySizeInKB

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
	list := make([]model.TerminalSession, 0, len(sessions))
	for _, s := range sessions {
		list = append(list, *s)
	}
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
	c := exec.Command(req.Shell)
	c.Env = append(os.Environ(), "TERM=xterm-256color", "LANG=en_US.UTF-8", "LC_ALL=en_US.UTF-8")

	// Start the command with a pty.
	ptmx, err := pty.Start(c)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    err,
		})
	}

	id := uuid.New().String()
	session := &model.TerminalSession{
		ID:      id,
		Shell:   req.Shell,
		Cmd:     c,
		PTY:     ptmx,
		Clients: make(map[*websocket.Conn]bool),
		History: make([]byte, 0, maxHistorySize),
	}

	sessionsMu.Lock()
	sessions[id] = session
	sessionsMu.Unlock()

	// Read from PTY in a goroutine
	go func() {
		defer func() {
			session.PTY.Close()
			sessionsMu.Lock()
			delete(sessions, id)
			sessionsMu.Unlock()
			// Close all clients
			session.ClientsMu.Lock()
			for client := range session.Clients {
				client.Close()
			}
			session.ClientsMu.Unlock()
		}()

		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if n > 0 {
				data := buf[:n]

				// Write to history
				session.HistoryMu.Lock()
				if len(session.History)+n > maxHistorySize {
					// Shift history (simple approach)
					keep := maxHistorySize - n
					if keep > 0 {
						session.History = append(session.History[len(session.History)-keep:], data...)
					} else {
						// Data is bigger than max history
						session.History = make([]byte, len(data))
						copy(session.History, data)
					}
				} else {
					session.History = append(session.History, data...)
				}
				session.HistoryMu.Unlock()

				// Broadcast to all clients
				session.ClientsMu.Lock()
				for client := range session.Clients {
					err := client.WriteMessage(websocket.BinaryMessage, data)
					if err != nil {
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
		"data":    id,
	})
}

// xóa 1 phiên terminal đang chạy
func KillTerminalSession(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    "Session ID is required",
		})
	}
	sessionsMu.Lock()
	session, exists := sessions[id]
	sessionsMu.Unlock()

	if !exists {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"data":    "session not found",
		})
	}

	// This will trigger the defer in the read loop which cleans up the session
	if session.Cmd.Process != nil {
		err := session.Cmd.Process.Kill()
		if err != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"data":    err,
			})
		}
	}
	session.PTY.Close()
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

	// Add client
	session.ClientsMu.Lock()
	session.Clients[ws] = true
	session.ClientsMu.Unlock()

	// Send history
	session.HistoryMu.Lock()
	if len(session.History) > 0 {
		ws.WriteMessage(websocket.BinaryMessage, session.History)
	}
	session.HistoryMu.Unlock()

	// Read from WS and write to PTY
	for {
		messageType, data, err := ws.ReadMessage()
		if err != nil {
			break
		}

		if messageType == websocket.TextMessage {
			// Check if it's a resize command
			var msg struct {
				Type string `json:"type"`
				Rows uint16 `json:"rows"`
				Cols uint16 `json:"cols"`
			}
			if err := json.Unmarshal(data, &msg); err == nil && msg.Type == "resize" {
				pty.Setsize(session.PTY, &pty.Winsize{
					Rows: msg.Rows,
					Cols: msg.Cols,
				})
				continue
			}
		}

		// otherwise, it's raw input
		if len(data) > 0 {
			session.PTY.Write(data)
		}
	}

	// Remove client
	session.ClientsMu.Lock()
	delete(session.Clients, ws)
	session.ClientsMu.Unlock()
}
