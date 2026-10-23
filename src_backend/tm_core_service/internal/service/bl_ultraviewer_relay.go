package service

// Đường dẫn tới relay UltraViewer: daemon mở TCP + TLS rồi chuyển byte hai
// chiều qua WebSocket, để module WASM chạy trong trình duyệt không cần tự
// làm TLS.
//
// Phần giao thức UltraViewer (đăng ký, tra cứu, login, giải mã màn hình)
// được port từ https://github.com/DeanOpen/MacViewer (giấy phép MIT) — xem
// src_wasm/ultraviewer/.
//
// Heartbeat/keepalive tới relay UltraViewer được di chuyển từ WASM sang daemon:
// - Tham khảo: src_wasm/ultraviewer/src/wire.rs (relay_keepalive_envelope, command_keepalive_envelope)
// - Tham khảo: src_wasm/ultraviewer/src/session.rs (send_heartbeat, HEARTBEAT_MS)
// - Frame bytes được hardcode khớp test trong wire.rs để tránh phải port toàn bộ 3DES cipher sang Go.
//   peer keepalive: [0x05,0x00,0x00,0x00,0x01,'p','i','n','g'] (system envelope "ping" không mã hoá)
//   command keepalive (mỗi 60s): [0x0a,0x00,0x00,0x00,0x01,0x00,...] (ciphertext của '2' với CommandCipher::server())
// Daemon giữ kết nối TCP tới relay, không phụ thuộc vào timer bị throttle của trình duyệt.
// Ở đây chỉ lo phần truyền tải + chứng thư ký + giữ kết nối alive tới relay.
//
// Giao thức WebSocket (một kết nối, nhiều kênh):
//
//	text (JSON)  browser → daemon
//	  {"t":"open","c":1,"host":"functions3.ultraviewer.net","port":443,
//	   "sni":"ultraviewer","cert":"functions3.ultraviewer.net"}
//	  {"t":"close","c":1}
//	  {"t":"listen","c":3}            mở listener LAN cho đường trực tiếp
//
//	text (JSON)  daemon → browser
//	  {"t":"open_ok","c":1,"ip":"192.168.1.10"}
//	  {"t":"open_err","c":1,"m":"..."}
//	  {"t":"closed","c":1,"m":"..."}
//	  {"t":"listen_ok","c":3,"ip":"192.168.1.10","port":54321,"key":"..."}
//	  {"t":"listen_err","c":3,"m":"..."}
//	  {"t":"direct_connected","c":3,"ip":"192.168.1.20"}
//
//	binary        cả hai chiều: byte đầu = số kênh, phần còn lại = byte thô.

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"tm_core_service/tm_common"
)

// ultraViewerRelayPort mặc định của relay UltraViewer.
const ultraViewerRelayPort = 443

// ultraViewerSNI là nhãn SNI mà mọi relay UltraViewer dùng (khác với tên
// chứng thư để xác minh).
const ultraViewerSNI = "ultraviewer"

// ultraViewerDialTimeout giới hạn thời gian mở kết nối tới relay.
const ultraViewerDialTimeout = 8 * time.Second

// ultraViewerWriteTimeout giới hạn thời gian ghi xuống relay.
const ultraViewerWriteTimeout = 30 * time.Second

// Sectigo Public Server Authentication Root R46 — gốc tin cậy mà các relay
// UltraViewer dùng (nguồn: MacViewer/ThirdParty, MIT).
const ultraViewerSectigoR46B64 = `MIIFijCCA3KgAwIBAgIQdY39i658BwD6qSWn4cetFDANBgkqhkiG9w0BAQwFADBfMQswCQYDVQQG
EwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQDEy1TZWN0aWdvIFB1YmxpYyBT
ZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYwHhcNMjEwMzIyMDAwMDAwWhcNNDYwMzIxMjM1
OTU5WjBfMQswCQYDVQQGEwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQDEy1T
ZWN0aWdvIFB1YmxpYyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYwggIiMA0GCSqGSIb3
DQEBAQUAA4ICDwAwggIKAoICAQCTvtU2UnXYASOgHEdCSe5jtrch/cSV1UgrJnwUUxDaef0rty2k
1Cz66jLdScK5vQ9IPXtamFSvnl0xdE8H/FAh3aTPaE8bEmNtJZlMKpnzSDBh+oF8HqcIStw+Kxwf
GExxqjWMrfhu6DtK2eWUAtaJhBOqbchPM8xQljeSM9xfiOefVNlI8JhD1mb9nxc4Q8UBUQvX4yMP
FF1bFOdLvt30yNoDN9HWOaEhUTCDsG3XME6WW5HwcCSrv0WBZEMNvSE6Lzzpng3LILVCJ8zab5vu
ZDCQOc2TZYEhMbUjUDM3IuM47fgxMMxF/mL50V0yeUKH32rMVhlATc6qu/m1dkmU8Sf4kaWD5Qaz
Yw6A3OASVYCmO2a0OYctyPDQ0RTp5A1NDvZdV3LFOxxHVp3i1fuBYYzMTYCQNFu31xR13NgESJ/A
wSiItOkcyqex8Va3e0lMWeUgFaiEAin6OJRpmkkGj80feRQXEgyDet4fsZfu+Zd4KKTIRJLpfSYF
plhym3kT2BFfrsU4YjRosoYwjviQYZ4ybPUHNs2iTG7sijbt8uaZFURww3y8nDnAtOFr94MlI1fZ
EoDlSfB1D++N6xybVCi0ITz8fAr/73trdf+LHaAZBav6+CuBQug4urv7qv094PPK306Xlynt8xhW
6aWWrL3DkJiy4Pmi1KZHQ3xtzwIDAQABo0IwQDAdBgNVHQ4EFgQUVnNYZJX5khqwEioEYnmhQBWI
IUkwDgYDVR0PAQH/BAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEMBQADggIBAC9c
mTz8Bl6MlC5w6tIyMY208FHVvArzZJ8HXtXBc2hkeqK5Duj5XYUtqDdFqij0lgVQYKlJfp/imTYp
E0RHap1VIDzYm/EDMrraQKFz6oOht0SmDpkBm+S8f74TlH7Kph52gDY9hAaLMyZlbcp+nv4fjFg4
exqDsQ+8FxG75gbMY/qB8oFM2gsQa6H61SilzwZAFv97fRheORKkU55+MkIQpiGRqRxOF3yEvJ+M
0ejf5lG5Nkc/kLnHvALcWxxPDkjBJYOcCj+esQMzEhonrPcibCTRAUH4WAP+JWgiH5paPHxsnnVI
84HxZmduTILA7rpXDhjvLpr3Etiga+kFpaHpaPi8TD8SHkXoUsCjvxInebnMMTzD9joiFgOgyY9m
pFuiTdaBJQbpdqQACj7LzTWb4OE4y2BThihCQRxEV+ioratF4yUQvNs+ZUH7G6aXD+u5dHn5Hrwd
Vw1Hr8Mvn4dGp+smWg9WY7ViYG4A++MnESLn/pmPNPW56MORcr3Ywx65LvKRRFHQV80MNNVIIb/b
E/FmJUNS0nAiNs2fxBx1IK1jcmMGDw4nztJqDby1ORrp0XZ60Vzk50lJLVU3aPAaOpg+VBeHVOmm
J1CJeyAvP/+/oYtKR5j/K3tJPsMpRmAYQqszKbrAKbkTidOIijlBO8n9pu0f9GBj39ItVQGL`

// Sectigo Public Server Authentication CA DV R36 (intermediate do Sectigo cấp,
// valid tới 2036-03-21). Relay chỉ gửi leaf certificate nên intermediate phải
// được cấp sẵn — không có nó thì chuỗi không dựng được (nguồn: MacViewer, MIT).
const ultraViewerSectigoDVR36B64 = `MIIGTDCCBDSgAwIBAgIQOXpmzCdWNi4NqofKbqvjsTANBgkqhkiG9w0BAQwFADBfMQswCQYDVQQG
EwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQDEy1TZWN0aWdvIFB1YmxpYyBT
ZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYwHhcNMjEwMzIyMDAwMDAwWhcNMzYwMzIxMjM1
OTU5WjBgMQswCQYDVQQGEwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTcwNQYDVQQDEy5T
ZWN0aWdvIFB1YmxpYyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gQ0EgRFYgUjM2MIIBojANBgkqhkiG
9w0BAQEFAAOCAY8AMIIBigKCAYEAljZf2HIz7+SPUPQCQObZYcrxLTHYdf1ZtMRe7YeqRPSwygz1
6qJ9cAWtWNTcuICc++p8Dct7zNGxCpqmEtqifO7NvuB5dEVexXn9RFFH12Hm+NtPRQgXIFjx6MSJ
cNWuVO3XGE57L1mHlcQYj+g4hny90aFh2SCZCDEVkAjaEMMfYPKuCjHuuF+bzHFb/9gV8P9+ekcH
ENF2nR1efGWSKwnfG5RawlkaQDpRtZTmM64TIsv/r7cyFO4nSjs1jLdXYdz5q3a4L0NoabZfbdxV
b+CUEHfB0bpulZQtH1Rv38e/lIdP7OTTIlZh6OYL6NhxP8So0/sht/4J9mqIGxRFc0/pC8suja+w
cIUna0HBpXKfXTKpzgis+zmXDL06ASJf5E4A2/m+Hp6b84sfPAwQ766rI65mh50S0Di9E3Pn2Wca
Jc+PILsBmYpgtmgWTR9eV9otfKRUBfzHUHcVgarub/XluEpRlTtZudU5xbFNxx/DgMrXLUAPaI60
fZ6wA+PTAgMBAAGjggGBMIIBfTAfBgNVHSMEGDAWgBRWc1hklfmSGrASKgRieaFAFYghSTAdBgNV
HQ4EFgQUaMASFhgOr872h6YyV6NGUV3LBycwDgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYB
Af8CAQAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAI
BgZngQwBAgEwVAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2NybC5zZWN0aWdvLmNvbS9TZWN0aWdv
UHVibGljU2VydmVyQXV0aGVudGljYXRpb25Sb290UjQ2LmNybDCBhAYIKwYBBQUHAQEEeDB2ME8G
CCsGAQUFBzAChkNodHRwOi8vY3J0LnNlY3RpZ28uY29tL1NlY3RpZ29QdWJsaWNTZXJ2ZXJBdXRo
ZW50aWNhdGlvblJvb3RSNDYucDdjMCMGCCsGAQUFBzABhhdodHRwOi8vb2NzcC5zZWN0aWdvLmNv
bTANBgkqhkiG9w0BAQwFAAOCAgEAYtOC9Fy+TqECFw40IospI92kLGgoSZGPOSQXMBqmsGWZUQ7r
ux7cj1du6d9rD6C8ze1B2eQjkrGkIL/OF1s7vSmgYVafsRoZd/IHUrkoQvX8FZwUsmPu7amgBfaY
3g+dq1x0jNGKb6I6Bzdl6LgMD9qxp+3i7GQOnd9J8LFSietY6Z4jUBzVoOoz8iAU84OFh2HhAuiP
w1ai0VnY38RTI+8kepGWVfGxfBWzwH9uIjeooIeaosVFvE8cmYUB4TSH5dUyD0jHct2+8ceKEtIo
FU/FfHq/mDaVnvcDCZXtIgitdMFQdMZaVehmObyhRdDD4NQCs0gaI9AAgFj4L9QtkARzhQLNyRf8
7Kln+YU0lgCGr9HLg3rGO8q+Y4ppLsOdunQZ6ZxPNGIfOApbPVf5hCe58EZwiWdHIMn9lPP6+F40
4y8NNugbQixBber+x536WrZhFZLjEkhp7fFXf9r32rNPfb74X/U90Bdy4lzp3+X1ukh1BuMxA/EE
hDoTOS3l7ABvc7BYSQubQ2490OcdkIzUh3ZwDrakMVrbaTxUM2p24N6dB+ns2zptWCva6jzWr8IW
KIMxzxLPv5Kt3ePKcUdvkBU/smqujSczTzzSjIoR5QqQA6lN1ZRSnuHIWCvhJEltkYnTAH41QJ6S
AWO66GrrUESwN/cgZzL4JLEqz1Y=`

// ultraViewerControlMessage là message điều khiển (JSON) hai chiều.
type ultraViewerControlMessage struct {
	Type string `json:"t"`
	// Channel là số kênh (1 = kênh lệnh, 2 = kênh dữ liệu với máy đối tác,
	// 3 = kênh LAN trực tiếp).
	Channel uint8  `json:"c"`
	Host    string `json:"host,omitempty"`
	Port    int    `json:"port,omitempty"`
	SNI     string `json:"sni,omitempty"`
	Cert    string `json:"cert,omitempty"`
	Message string `json:"m,omitempty"`
	IP      string `json:"ip,omitempty"`
	// Key là khoá phiên của kênh LAN trực tiếp.
	Key string `json:"key,omitempty"`
}

// ultraViewerChannel là một kết nối TCP/TLS tới relay.
type ultraViewerChannel struct {
	id   uint8
	conn net.Conn
}

// ultraViewerWriter ghi xuống WebSocket. gorilla/websocket chỉ cho phép một
// goroutine ghi tại một thời điểm nên phải có khoá: vừa có goroutine chuyển byte
// từ relay về, vừa có goroutine chính gửi message điều khiển.
type ultraViewerWriter struct {
	mu   sync.Mutex
	conn *websocket.Conn
}

// writeBinary gửi một message nhị phân xuống trình duyệt.
func (w *ultraViewerWriter) writeBinary(payload []byte) error {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.conn.WriteMessage(websocket.BinaryMessage, payload)
}

// writeControl gửi một message điều khiển JSON xuống trình duyệt.
func (w *ultraViewerWriter) writeControl(control ultraViewerControlMessage) {
	payload, err := json.Marshal(control)
	if err != nil {
		return
	}
	w.mu.Lock()
	defer w.mu.Unlock()
	w.conn.WriteMessage(websocket.TextMessage, payload)
}

var (
	// ultraViewerPeerKeepaliveFrame: tham khảo src_wasm/ultraviewer/src/wire.rs:relay_keepalive_envelope()
	// system_envelope(b"ping", false) bọc trong frame length-prefixed LE -> [0x05,0x00,0x00,0x00, 0x01, 'p','i','n','g']
	ultraViewerPeerKeepaliveFrame = []byte{0x05, 0x00, 0x00, 0x00, 0x01, 0x70, 0x69, 0x6e, 0x67}
	// ultraViewerCommandKeepaliveFrame: tham khảo src_wasm/ultraviewer/src/wire.rs:command_keepalive_envelope()
	// system_envelope(CommandCipher::server().encrypt(b"2"), true) bọc frame
	// Giá trị khớp test wire.rs:relay_envelope_fixtures() "command_keepalive_envelope"
	ultraViewerCommandKeepaliveFrame = []byte{0x0a, 0x00, 0x00, 0x00, 0x01, 0x00, 0x2d, 0x93, 0x29, 0x71, 0xdd, 0x9d, 0xcb, 0x2d}
)

// ultraViewerSession giữ toàn bộ kênh của một phiên trình duyệt.
type ultraViewerSession struct {
	mu       sync.Mutex
	channels map[uint8]*ultraViewerChannel
	writer   *ultraViewerWriter
	// Listener LAN cho kênh trực tiếp (mở sau khi trình duyệt yêu cầu).
	directListener *ultraViewerDirect
	// Kết nối đã thiết lập với máy đối tác qua đường LAN trực tiếp.
	directChannel *ultraViewerDirectChannel
	closed        bool
	keepaliveTicks int
}

// HandleUltraViewerWebSocket là endpoint WebSocket cho module WASM UltraViewer.
//
//	GET /ultraviewer/ws
//
// Nhiệm vụ: mở kết nối TCP + TLS tới relay UltraViewer rồi chuyển byte hai
// chiều. Toàn bộ giao thức UltraViewer nằm ở phía WASM.
func HandleUltraViewerWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		tm_common.LogError(fmt.Sprintf("[UltraViewer] Không nâng cấp được WebSocket: %v", err))
		return
	}
	defer conn.Close()

	session := &ultraViewerSession{
		channels: make(map[uint8]*ultraViewerChannel),
		writer:   &ultraViewerWriter{conn: conn},
	}
	session.startHeartbeatLoop()
	defer session.closeAll()

	tm_common.LogInfo("[UltraViewer] Có kết nối WebSocket mới")

	// Đọc message điều khiển (JSON) và dữ liệu nhị phân từ trình duyệt.
	for {
		messageType, data, err := conn.ReadMessage()
		if err != nil {
			tm_common.LogInfo(fmt.Sprintf("[UltraViewer] Kết nối WebSocket đã đóng: %v", err))
			return
		}
		if messageType == websocket.TextMessage {
			var control ultraViewerControlMessage
			if err := json.Unmarshal(data, &control); err != nil {
				session.writer.writeControl(ultraViewerControlMessage{
					Type:    "open_err",
					Message: "Sai định dạng message điều khiển.",
				})
				continue
			}
			session.handleControl(control)
			continue
		}
		if len(data) < 2 {
			continue
		}
		channelID := data[0]
		payload := data[1:]
		if err := session.writeToChannel(channelID, payload); err != nil {
			tm_common.LogError(fmt.Sprintf("[UltraViewer] Ghi xuống relay thất bại: %v", err))
		}
	}
}

// handleControl xử lý message điều khiển từ trình duyệt.
func (s *ultraViewerSession) handleControl(control ultraViewerControlMessage) {
	switch control.Type {
	case "open":
		if err := s.openChannel(control); err != nil {
			tm_common.LogError(fmt.Sprintf("[UltraViewer] Mở kênh tới relay thất bại: %v", err))
			s.writer.writeControl(ultraViewerControlMessage{
				Type:    "open_err",
				Channel: control.Channel,
				Message: err.Error(),
			})
		}
	case "listen":
		// Mở listener LAN để máy đối tác kết nối thẳng (bỏ qua relay).
		s.startDirectListener()
	case "listen_close":
		// Đóng listener LAN nhưng giữ nguyên kết nối đã thiết lập.
		s.closeDirectListener()
	case "close":
		if control.Channel == ultraViewerDirectChannelID {
			s.closeDirect()
			return
		}
		s.closeChannel(control.Channel)
	}
}

// openChannel mở kết nối TCP + TLS tới relay rồi bắt đầu chuyển byte.
func (s *ultraViewerSession) openChannel(control ultraViewerControlMessage) error {
	host := strings.TrimSpace(control.Host)
	if host == "" {
		return fmt.Errorf("Thiếu địa chỉ relay")
	}
	port := control.Port
	if port <= 0 || port > 65535 {
		port = ultraViewerRelayPort
	}
	certHost := strings.TrimSpace(control.Cert)
	if certHost == "" {
		certHost = host
	}

	// Đóng kênh cũ cùng số trước khi mở kênh mới.
	s.closeChannel(control.Channel)

	relayConn, err := dialUltraViewerRelay(host, port, certHost)
	if err != nil {
		return err
	}

	channel := &ultraViewerChannel{id: control.Channel, conn: relayConn}
	s.mu.Lock()
	s.channels[control.Channel] = channel
	s.mu.Unlock()

	s.writer.writeControl(ultraViewerControlMessage{
		Type:    "open_ok",
		Channel: control.Channel,
		IP:      localIPv4Address(),
	})
	tm_common.LogInfo(fmt.Sprintf("[UltraViewer] Đã mở kênh %d tới %s:%d", control.Channel, host, port))

	// Chuyển byte relay → trình duyệt.
	go func() {
		defer s.closeChannel(channel.id)
		buf := make([]byte, 64*1024)
		for {
			n, err := relayConn.Read(buf)
			if n > 0 {
				payload := make([]byte, n+1)
				payload[0] = channel.id
				copy(payload[1:], buf[:n])
				if writeErr := s.writer.writeBinary(payload); writeErr != nil {
					return
				}
			}
			if err != nil {
				if !isClosedConnError(err) {
					tm_common.LogError(fmt.Sprintf("[UltraViewer] Kênh %d bị lỗi: %v", channel.id, err))
				}
				s.writer.writeControl(ultraViewerControlMessage{
					Type:    "closed",
					Channel: channel.id,
					Message: "Kết nối tới relay đã đóng.",
				})
				return
			}
		}
	}()
	return nil
}

// writeToChannel ghi byte xuống kênh tương ứng.
func (s *ultraViewerSession) writeToChannel(channelID uint8, payload []byte) error {
	if channelID == ultraViewerDirectChannelID {
		s.mu.Lock()
		channel := s.directChannel
		s.mu.Unlock()
		if channel == nil {
			return fmt.Errorf("Kênh LAN trực tiếp chưa có máy đối tác kết nối")
		}
		return channel.write(payload)
	}
	s.mu.Lock()
	channel := s.channels[channelID]
	s.mu.Unlock()
	if channel == nil {
		return fmt.Errorf("Kênh %d chưa mở", channelID)
	}
	channel.conn.SetWriteDeadline(time.Now().Add(ultraViewerWriteTimeout))
	_, err := channel.conn.Write(payload)
	return err
}

// closeChannel đóng một kênh.
func (s *ultraViewerSession) closeChannel(channelID uint8) {
	s.mu.Lock()
	channel := s.channels[channelID]
	delete(s.channels, channelID)
	s.mu.Unlock()
	if channel == nil {
		return
	}
	channel.conn.Close()
}

// closeAll đóng toàn bộ kênh.
func (s *ultraViewerSession) closeAll() {
	s.mu.Lock()
	channels := s.channels
	s.channels = make(map[uint8]*ultraViewerChannel)
	s.closed = true
	s.mu.Unlock()
	for _, channel := range channels {
		channel.conn.Close()
	}
	s.closeDirect()
}

// dialUltraViewerRelay mở TCP + TLS tới relay UltraViewer.
//
// Chứng thư được kiểm tra theo tên `certHost` (không phải nhãn SNI
// "ultraviewer"), dùng kho gốc tin cậy của hệ thống cộng thêm Sectigo R46,
// và chấp nhận chứng thư hết hạn (relay hay dùng chứng thư cũ) bằng cách
// thử lại ở thời điểm còn hiệu lực.
func dialUltraViewerRelay(host string, port int, certHost string) (net.Conn, error) {
	address := net.JoinHostPort(host, fmt.Sprintf("%d", port))
	dialer := &net.Dialer{Timeout: ultraViewerDialTimeout}
	raw, err := dialer.Dial("tcp", address)
	if err != nil {
		return nil, fmt.Errorf("Không kết nối được tới relay %s: %w", address, err)
	}
	if tcpConn, ok := raw.(*net.TCPConn); ok {
		tcpConn.SetNoDelay(true)
	}

	tlsConfig, err := ultraViewerTLSConfig(certHost)
	if err != nil {
		raw.Close()
		return nil, err
	}
	tlsConn := tls.Client(raw, tlsConfig)
	tlsConn.SetDeadline(time.Now().Add(ultraViewerDialTimeout))
	if err := tlsConn.Handshake(); err != nil {
		raw.Close()
		return nil, fmt.Errorf("Bắt tay TLS với relay %s thất bại: %w", address, err)
	}
	tlsConn.SetDeadline(time.Time{})
	return tlsConn, nil
}

// ultraViewerTLSConfig dựng cấu hình TLS kiểm tra chứng thư relay.
func ultraViewerTLSConfig(certHost string) (*tls.Config, error) {
	roots, err := ultraViewerRootPool()
	if err != nil {
		return nil, err
	}
	intermediate, err := ultraViewerIntermediatePool()
	if err != nil {
		return nil, err
	}
	return &tls.Config{
		// SNI luôn là "ultraviewer" nhưng tên chứng thư phải khớp `certHost`,
		// nên việc kiểm tra chứng thư làm thủ công bên dưới.
		ServerName:         ultraViewerSNI,
		InsecureSkipVerify: true,
		VerifyPeerCertificate: func(rawCerts [][]byte, _ [][]*x509.Certificate) error {
			return verifyUltraViewerCertificate(rawCerts, certHost, roots, intermediate)
		},
		MinVersion: tls.VersionTLS12,
	}, nil
}

// verifyUltraViewerCertificate kiểm tra chuỗi chứng thư của relay.
//
// Nếu chứng thư đã hết hạn, thử lại với thời điểm ngay trước khi hết hạn:
// relay UltraViewer hay dùng chứng thư cũ nhưng máy đối tác vẫn chấp nhận.
func verifyUltraViewerCertificate(rawCerts [][]byte, certHost string, roots *x509.CertPool, intermediates *x509.CertPool) error {
	if len(rawCerts) == 0 {
		return fmt.Errorf("Relay không gửi chứng thư")
	}
	certs := make([]*x509.Certificate, 0, len(rawCerts))
	for _, raw := range rawCerts {
		cert, err := x509.ParseCertificate(raw)
		if err != nil {
			return fmt.Errorf("Chứng thư relay không hợp lệ: %w", err)
		}
		certs = append(certs, cert)
	}
	leaf := certs[0]
	chain := intermediates.Clone()
	for _, cert := range certs[1:] {
		chain.AddCert(cert)
	}

	verifyAt := func(at time.Time) error {
		_, err := leaf.Verify(x509.VerifyOptions{
			DNSName:       certHost,
			Roots:         roots,
			Intermediates: chain,
			CurrentTime:   at,
			KeyUsages:     []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		})
		return err
	}

	err := verifyAt(time.Now())
	if err == nil {
		return nil
	}
	// Chứng thư hết hạn: thử lại ở thời điểm còn hiệu lực.
	if certErr, ok := err.(x509.CertificateInvalidError); ok && certErr.Reason == x509.Expired {
		retryAt := leaf.NotAfter.Add(-time.Second)
		if retryErr := verifyAt(retryAt); retryErr == nil {
			return nil
		}
	}
	return fmt.Errorf("Chứng thư của relay không hợp lệ: %w", err)
}

// ultraViewerRootPool gộp kho gốc tin cậy của hệ thống với Sectigo R46.
func ultraViewerRootPool() (*x509.CertPool, error) {
	pool, err := x509.SystemCertPool()
	if err != nil || pool == nil {
		pool = x509.NewCertPool()
	}
	der, err := base64.StdEncoding.DecodeString(strings.Join(strings.Fields(ultraViewerSectigoR46B64), ""))
	if err != nil {
		return nil, fmt.Errorf("Chứng thư gốc Sectigo R46 không hợp lệ: %w", err)
	}
	cert, err := x509.ParseCertificate(der)
	if err != nil {
		return nil, fmt.Errorf("Chứng thư gốc Sectigo R46 không hợp lệ: %w", err)
	}
	pool.AddCert(cert)
	return pool, nil
}

// ultraViewerIntermediatePool chứa intermediate Sectigo DV R36.
func ultraViewerIntermediatePool() (*x509.CertPool, error) {
	pool := x509.NewCertPool()
	der, err := base64.StdEncoding.DecodeString(strings.Join(strings.Fields(ultraViewerSectigoDVR36B64), ""))
	if err != nil {
		return nil, fmt.Errorf("Chứng thư intermediate Sectigo không hợp lệ: %w", err)
	}
	cert, err := x509.ParseCertificate(der)
	if err != nil {
		return nil, fmt.Errorf("Chứng thư intermediate Sectigo không hợp lệ: %w", err)
	}
	pool.AddCert(cert)
	return pool, nil
}

// localIPv4Address trả về IPv4 nội bộ của máy chạy daemon (để viewer gửi
// trong thông tin đăng ký).
func localIPv4Address() string {
	addresses, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, address := range addresses {
		ipNet, ok := address.(*net.IPNet)
		if !ok || ipNet.IP.IsLoopback() {
			continue
		}
		if ipv4 := ipNet.IP.To4(); ipv4 != nil {
			return ipv4.String()
		}
	}
	return ""
}

// startHeartbeatLoop gửi keepalive tới relay UltraViewer trực tiếp từ daemon
// Tham khảo src_wasm/ultraviewer/src/session.rs:send_heartbeat()
// Mỗi 10s gửi peer keepalive, mỗi 60s (ticks%6==0) gửi command keepalive.
// Được di chuyển sang Go để không phụ thuộc vào timer bị throttle của trình duyệt.
func (s *ultraViewerSession) startHeartbeatLoop() {
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			<-ticker.C
			s.mu.Lock()
			if s.closed {
				s.mu.Unlock()
				return
			}
			channels := make(map[uint8]*ultraViewerChannel, len(s.channels))
			for k, v := range s.channels {
				channels[k] = v
			}
			s.keepaliveTicks++
			ticks := s.keepaliveTicks
			s.mu.Unlock()

			// Heartbeat kênh peer (giống WASM send_heartbeat)
			if ch, ok := channels[2]; ok && ch != nil && ch.conn != nil {
				ch.conn.SetWriteDeadline(time.Now().Add(ultraViewerWriteTimeout))
				_, _ = ch.conn.Write(ultraViewerPeerKeepaliveFrame)
			}
			// Mỗi 60s gửi keepalive kênh command (giống WASM heartbeat_ticks % 6 == 0)
			if ticks%6 == 0 {
				if ch, ok := channels[1]; ok && ch != nil && ch.conn != nil {
					ch.conn.SetWriteDeadline(time.Now().Add(ultraViewerWriteTimeout))
					_, _ = ch.conn.Write(ultraViewerCommandKeepaliveFrame)
				}
			}
		}
	}()
}

// isClosedConnError kiểm tra lỗi do đóng kết nối (không phải lỗi thật).
func isClosedConnError(err error) bool {
	if err == nil {
		return false
	}
	message := err.Error()
	return strings.Contains(message, "use of closed network connection") ||
		strings.Contains(message, "connection reset by peer") ||
		strings.Contains(message, "broken pipe") ||
		strings.Contains(message, "EOF")
}
