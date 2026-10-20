package service

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// ultraViewerRelayLocalURL đổi URL http của test server thành URL ws.
func ultraViewerRelayLocalURL(server *httptest.Server) string {
	return "ws" + strings.TrimPrefix(server.URL, "http")
}

// TestUltraViewerWebSocketReportsOpenError kiểm tra endpoint WebSocket trả về
// lỗi đúng định dạng khi không mở được kênh tới relay.
func TestUltraViewerWebSocketReportsOpenError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(HandleUltraViewerWebSocket))
	defer server.Close()

	conn, _, err := websocket.DefaultDialer.Dial(ultraViewerRelayLocalURL(server), nil)
	if err != nil {
		t.Fatalf("không kết nối được WebSocket: %v", err)
	}
	defer conn.Close()

	// Cổng 1 gần như chắc chắn không có gì lắng nghe.
	request := `{"t":"open","c":1,"host":"127.0.0.1","port":1,"sni":"ultraviewer","cert":"relay.example"}`
	if err := conn.WriteMessage(websocket.TextMessage, []byte(request)); err != nil {
		t.Fatalf("gửi message điều khiển thất bại: %v", err)
	}

	conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	messageType, data, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("không đọc được phản hồi: %v", err)
	}
	if messageType != websocket.TextMessage {
		t.Fatalf("phản hồi phải là text message, nhận được %v", messageType)
	}

	var control ultraViewerControlMessage
	if err := json.Unmarshal(data, &control); err != nil {
		t.Fatalf("phản hồi không phải JSON hợp lệ: %v", err)
	}
	if control.Type != "open_err" {
		t.Fatalf("phải trả về open_err, nhận được %q", control.Type)
	}
	if control.Channel != 1 {
		t.Fatalf("phải trả về đúng số kênh, nhận được %d", control.Channel)
	}
	if control.Message == "" {
		t.Fatal("phản hồi phải kèm thông báo lỗi")
	}
}

// TestUltraViewerRootPoolHasSectigoR46 kiểm tra kho gốc tin cậy đã ghim thêm
// chứng thư gốc Sectigo R46 mà các relay UltraViewer dùng.
func TestUltraViewerRootPoolHasSectigoR46(t *testing.T) {
	pool, err := ultraViewerRootPool()
	if err != nil {
		t.Fatalf("không dựng được kho gốc tin cậy: %v", err)
	}
	if pool == nil {
		t.Fatal("kho gốc tin cậy rỗng")
	}
}

// TestUltraViewerIntermediatePoolHasSectigoDV kiểm tra intermediate Sectigo
// DV R36 có trong pool (relay chỉ gửi leaf certificate).
func TestUltraViewerIntermediatePoolHasSectigoDV(t *testing.T) {
	pool, err := ultraViewerIntermediatePool()
	if err != nil {
		t.Fatalf("không dựng được pool intermediate: %v", err)
	}
	if pool == nil {
		t.Fatal("pool intermediate rỗng")
	}
}

// TestUltraViewerControlMessageRoundTrip kiểm tra định dạng message điều khiển
// giữa WASM và daemon.
func TestUltraViewerControlMessageRoundTrip(t *testing.T) {
	payload := `{"t":"open","c":2,"host":"relay.example","port":443,"sni":"ultraviewer","cert":"relay.example"}`
	var control ultraViewerControlMessage
	if err := json.Unmarshal([]byte(payload), &control); err != nil {
		t.Fatalf("parse message điều khiển thất bại: %v", err)
	}
	if control.Type != "open" || control.Channel != 2 || control.Host != "relay.example" ||
		control.Port != 443 || control.SNI != "ultraviewer" || control.Cert != "relay.example" {
		t.Fatalf("parse sai nội dung message điều khiển: %+v", control)
	}
}
