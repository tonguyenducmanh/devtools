package model

import (
	"os"
	"os/exec"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type CreateTerminalRequest struct {
	Shell string `json:"shell"`
	Name  string `json:"name"`
}

type TerminalSession struct {
	TDBaseModel
	CreatedDateRaw time.Time                `json:"-"`
	Shell          string                   `json:"shell"`
	Name           string                   `json:"name"`
	Cmd            *exec.Cmd                `json:"-"`
	PTY            *os.File                 `json:"-"`
	Clients        map[*websocket.Conn]bool `json:"-"`
	ClientsMu      sync.Mutex               `json:"-"`
	History        []byte                   `json:"-"`
	HistoryMu      sync.Mutex               `json:"-"`
}

type ShellOption struct {
	Name string `json:"name"`
	Path string `json:"path"`
}
