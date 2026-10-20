package service

// Kiểm thử kênh LAN trực tiếp của UltraViewer.
//
// Mã hoá phải khớp đúng với client gốc của UltraViewer (RemoteControl.AES):
//   khung  = LE32(len) + IV(16) + AES-256-CBC/PKCS7(flag byte + payload)
//   khóa   = MD5(key) chép vào 0..16 và 15..31 (lần chồng byte 15)
// Vector kiểm thử được đối chiếu với `openssl enc -aes-256-cbc`.

import (
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestUltraViewerDirectKeyDerivation(t *testing.T) {
	codec, err := newUltraViewerDirectCodec("abc123XYZ4567")
	if err != nil {
		t.Fatalf("tạo codec thất bại: %v", err)
	}
	// MD5("abc123XYZ4567") = 6ef919ae7fa27739c451eda554a610c6
	// key = digest[0..15] + digest[0..16] + 0x00 (lần chồng byte 15).
	want := "6ef919ae7fa27739c451eda554a6106ef919ae7fa27739c451eda554a610c600"
	got := hex.EncodeToString(codec.key[:])
	if got != want {
		t.Fatalf("khoá sai:\n có  %s\n cần %s", got, want)
	}
}

func TestUltraViewerDirectCodecMatchesOpenSSL(t *testing.T) {
	codec, err := newUltraViewerDirectCodec("abc123XYZ4567")
	if err != nil {
		t.Fatalf("tạo codec thất bại: %v", err)
	}
	iv := make([]byte, 16)
	frame, err := codec.encryptWithIV(false, []byte("hello"), iv)
	if err != nil {
		t.Fatalf("mã hoá thất bại: %v", err)
	}
	// Khung = LE32(len) + IV + ciphertext.
	if len(frame) != 4+16+16 {
		t.Fatalf("độ dài khung không đúng: %d", len(frame))
	}
	if size := binary.LittleEndian.Uint32(frame[:4]); int(size) != 32 {
		t.Fatalf("trường độ dài sai: %d", size)
	}
	if !bytes.Equal(frame[4:20], iv) {
		t.Fatalf("IV không đúng vị trí")
	}
	// openssl enc -aes-256-cbc -K <key> -iv 0..0 với plaintext = 0x00 + "hello"
	want := "0c868a2418e78cae502d36fc5cc4b461"
	got := hex.EncodeToString(frame[20:])
	if got != want {
		t.Fatalf("ciphertext sai:\n có  %s\n cần %s", got, want)
	}
}

func TestUltraViewerDirectCodecRoundTrip(t *testing.T) {
	codec, err := newUltraViewerDirectCodec("abc123XYZ4567")
	if err != nil {
		t.Fatalf("tạo codec thất bại: %v", err)
	}
	payload := []byte("12|||xin chao")
	frame, err := codec.encrypt(true, payload)
	if err != nil {
		t.Fatalf("mã hoá thất bại: %v", err)
	}
	flag, decoded, err := codec.decrypt(frame[4:])
	if err != nil {
		t.Fatalf("giải mã thất bại: %v", err)
	}
	if !flag {
		t.Fatalf("cờ định dạng phải là 1")
	}
	if !bytes.Equal(decoded, payload) {
		t.Fatalf("payload sai: %q", decoded)
	}
}

func TestUltraViewerDirectCodecRejectsGarbage(t *testing.T) {
	codec, err := newUltraViewerDirectCodec("abc123XYZ4567")
	if err != nil {
		t.Fatalf("tạo codec thất bại: %v", err)
	}
	if _, _, err := codec.decrypt([]byte{1, 2, 3}); err == nil {
		t.Fatalf("phải từ chối khung quá ngắn")
	}
	if _, _, err := codec.decrypt(make([]byte, 32)); err == nil {
		t.Fatalf("phải từ chối padding sai")
	}
}

func TestUltraViewerFrameBufferSplitsFrames(t *testing.T) {
	var buffer ultraViewerFrameBuffer
	payload := []byte("abc")
	frame := make([]byte, 4+len(payload))
	binary.LittleEndian.PutUint32(frame[:4], uint32(len(payload)))
	copy(frame[4:], payload)

	// Gửi nửa frame → chưa có kết quả.
	frames, err := buffer.push(frame[:3])
	if err != nil {
		t.Fatalf("tách khung thất bại: %v", err)
	}
	if len(frames) != 0 {
		t.Fatalf("chưa đủ dữ liệu nhưng đã trả %d khung", len(frames))
	}
	// Gửi nốt phần còn lại → có 1 khung.
	frames, err = buffer.push(frame[3:])
	if err != nil {
		t.Fatalf("tách khung thất bại: %v", err)
	}
	if len(frames) != 1 || !bytes.Equal(frames[0], payload) {
		t.Fatalf("khung không đúng: %v", frames)
	}
}

func TestLocalLanIPv4AddressIsPrivate(t *testing.T) {
	// Máy chạy test có thể không có mạng LAN → hàm phải trả về rỗng,
	// tuyệt đối không trả về địa chỉ công cộng (để không mở cổng ra ngoài).
	ip := localLanIPv4Address()
	if ip == "" {
		return
	}
	if !isLanIPv4(net.ParseIP(ip)) {
		t.Fatalf("địa chỉ LAN phải thuộc mạng riêng: %s", ip)
	}
}

// TestUltraViewerDirectChannelRoundTrip kiểm tra kênh LAN trực tiếp hoạt
// động từ đầu đến cuối: trình duyệt mở listener, máy đối tác kết nối vào,
// hai chiều đều được mã hoá/giải mã đúng.
func TestUltraViewerDirectChannelRoundTrip(t *testing.T) {
	if localLanIPv4Address() == "" {
		t.Skip("máy chạy test không có mạng LAN riêng")
	}
	server := httptest.NewServer(http.HandlerFunc(HandleUltraViewerWebSocket))
	defer server.Close()

	browser, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(server.URL, "http"), nil)
	if err != nil {
		t.Fatalf("không kết nối được WebSocket: %v", err)
	}
	defer browser.Close()

	// 1. Yêu cầu mở listener LAN.
	if err := browser.WriteMessage(websocket.TextMessage, []byte(`{"t":"listen","c":3}`)); err != nil {
		t.Fatalf("gửi yêu cầu listen thất bại: %v", err)
	}
	browser.SetReadDeadline(time.Now().Add(10 * time.Second))
	_, data, err := browser.ReadMessage()
	if err != nil {
		t.Fatalf("không đọc được phản hồi: %v", err)
	}
	var control ultraViewerControlMessage
	if err := json.Unmarshal(data, &control); err != nil {
		t.Fatalf("phản hồi không phải JSON hợp lệ: %v", err)
	}
	if control.Type != "listen_ok" {
		t.Fatalf("phải trả về listen_ok, nhận được %q (%s)", control.Type, control.Message)
	}
	if control.Key == "" || control.Port == 0 || control.IP == "" {
		t.Fatalf("listen_ok thiếu thông tin: %+v", control)
	}

	// 2. Máy đối tác kết nối thẳng vào listener.
	host, err := net.Dial("tcp", net.JoinHostPort(control.IP, strconv.Itoa(control.Port)))
	if err != nil {
		t.Fatalf("máy đối tác không kết nối được vào listener: %v", err)
	}
	defer host.Close()

	// Daemon phải báo đã có kết nối trực tiếp.
	browser.SetReadDeadline(time.Now().Add(10 * time.Second))
	_, data, err = browser.ReadMessage()
	if err != nil {
		t.Fatalf("không đọc được thông báo kết nối: %v", err)
	}
	if err := json.Unmarshal(data, &control); err != nil {
		t.Fatalf("thông báo không phải JSON hợp lệ: %v", err)
	}
	if control.Type != "direct_connected" {
		t.Fatalf("phải trả về direct_connected, nhận được %q", control.Type)
	}

	codec, err := newUltraViewerDirectCodec(control.Key)
	if err != nil {
		t.Fatalf("tạo codec thất bại: %v", err)
	}

	// 3. Máy đối tác gửi màn hình (payload thô) → trình duyệt nhận payload đã giải mã.
	payload := []byte("12|||xin chao")
	frame, err := codec.encrypt(false, payload)
	if err != nil {
		t.Fatalf("mã hoá thất bại: %v", err)
	}
	if _, err := host.Write(frame); err != nil {
		t.Fatalf("máy đối tác gửi khung thất bại: %v", err)
	}

	browser.SetReadDeadline(time.Now().Add(10 * time.Second))
	messageType, data, err := browser.ReadMessage()
	if err != nil {
		t.Fatalf("không đọc được dữ liệu từ trình duyệt: %v", err)
	}
	if messageType != websocket.BinaryMessage {
		t.Fatalf("phải là binary message, nhận được %v", messageType)
	}
	if len(data) < 5 || data[0] != ultraViewerDirectChannelID {
		t.Fatalf("byte đầu phải là số kênh %d", ultraViewerDirectChannelID)
	}
	size := binary.LittleEndian.Uint32(data[1:5])
	if int(size) != len(data)-5 {
		t.Fatalf("độ dài khung không khớp: %d vs %d", size, len(data)-5)
	}
	message := data[5:]
	if message[0] != 0 {
		t.Fatalf("byte cờ định dạng phải là 0, nhận %d", message[0])
	}
	if !bytes.Equal(message[1:], payload) {
		t.Fatalf("payload sai: %q", message[1:])
	}

	// 4. Trình duyệt gửi ngược lại → máy đối tác nhận payload đã giải mã.
	reply := []byte("8|||512|||0|||10|||20")
	outFrame := make([]byte, 0, 4+1+len(reply))
	outFrame = binary.LittleEndian.AppendUint32(outFrame, uint32(1+len(reply)))
	outFrame = append(outFrame, 0)
	outFrame = append(outFrame, reply...)
	out := make([]byte, 0, 1+len(outFrame))
	out = append(out, ultraViewerDirectChannelID)
	out = append(out, outFrame...)
	if err := browser.WriteMessage(websocket.BinaryMessage, out); err != nil {
		t.Fatalf("trình duyệt gửi dữ liệu thất bại: %v", err)
	}

	host.SetReadDeadline(time.Now().Add(10 * time.Second))
	var header [4]byte
	if _, err := host.Read(header[:]); err != nil {
		t.Fatalf("máy đối tác không đọc được khung: %v", err)
	}
	length := binary.LittleEndian.Uint32(header[:])
	if length == 0 || length > 1024 {
		t.Fatalf("độ dài khung không hợp lệ: %d", length)
	}
	body := make([]byte, length)
	if _, err := readFull(host, body); err != nil {
		t.Fatalf("máy đối tác không đọc được phần thân khung: %v", err)
	}
	flag, decoded, err := codec.decrypt(body)
	if err != nil {
		t.Fatalf("giải mã khung thất bại: %v", err)
	}
	if flag {
		t.Fatalf("cờ định dạng phải là 0")
	}
	if !bytes.Equal(decoded, reply) {
		t.Fatalf("payload gửi ngược sai: %q", decoded)
	}
}

// readFull đọc đủ số byte yêu cầu.
func readFull(conn net.Conn, buffer []byte) (int, error) {
	read := 0
	for read < len(buffer) {
		n, err := conn.Read(buffer[read:])
		read += n
		if err != nil {
			return read, err
		}
	}
	return read, nil
}
