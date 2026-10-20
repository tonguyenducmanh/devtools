package service

// Kênh LAN direct của UltraViewer.
//
// Khi 2 máy cùng mạng LAN, client gốc của UltraViewer không đi qua relay mà
// để máy đối tác tự kết nối thẳng vào máy viewer. Cách làm:
//  1. Viewer mở 1 listener TCP trên IP LAN của nó.
//  2. Viewer gửi kèm "direct details" trong lệnh tra cứu máy đối tác:
//     "IPRelay|PortRelay|IPLAN|PortLAN|key".
//  3. Máy đối tác đọc thông tin đó và tự kết nối vào listener.
//
// Kênh này mã hoá giống hệt client gốc (RemoteControl.AES của UltraViewer):
//
//	khung  = LE32(độ dài) + IV(16 byte) + AES-256-CBC/PKCS7(flag byte + payload)
//	khóa   = MD5(key) chép vào 0..16 và 15..31 (lần chồng byte 15)
//
// Daemon làm trung gian: nhận byte từ host → giải mã → đẩy cho trình duyệt,
// và ngược lại (mã hoá → gửi host). Trình duyệt không cần biết tới AES.

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"io"
	"net"
	"sync"
	"time"

	"tm_core_service/tm_common"
)

// ultraViewerDirectChannelID là số kênh dùng cho đường LAN trực tiếp.
const ultraViewerDirectChannelID uint8 = 3

// ultraViewerDirectKeyAlphabet là bảng ký tự dùng sinh khoá phiên (14 ký tự).
const ultraViewerDirectKeyAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz"

// ultraViewerDirectMaxFrame giới hạn 1 khung sau khi giải mã.
const ultraViewerDirectMaxFrame = 16 * 1024 * 1024

// ultraViewerDirectAcceptTimeout là thời gian chờ máy đối tác kết nối vào.
const ultraViewerDirectAcceptTimeout = 30 * time.Second

// ultraViewerDirectCodec mã hoá/giải mã khung của kênh LAN direct.
type ultraViewerDirectCodec struct {
	block cipher.Block
	// key là vật liệu khoá 32 byte (MD5 chồng 2 lần).
	key [32]byte
}

// newUltraViewerDirectCodec dựng codec từ khoá phiên (chuỗi 14 ký tự).
func newUltraViewerDirectCodec(key string) (*ultraViewerDirectCodec, error) {
	if key == "" {
		return nil, fmt.Errorf("khoá LAN trống")
	}
	digest := md5.Sum([]byte(key))
	var material [32]byte
	copy(material[0:16], digest[:])
	copy(material[15:31], digest[:])
	block, err := aes.NewCipher(material[:])
	if err != nil {
		return nil, err
	}
	return &ultraViewerDirectCodec{block: block, key: material}, nil
}

// encrypt mã hoá 1 khung: LE32(len) + IV + ciphertext.
func (c *ultraViewerDirectCodec) encrypt(formatFlag bool, payload []byte) ([]byte, error) {
	blockSize := c.block.BlockSize()
	iv := make([]byte, blockSize)
	if _, err := rand.Read(iv); err != nil {
		return nil, err
	}
	return c.encryptWithIV(formatFlag, payload, iv)
}

// encryptWithIV mã hoá 1 khung với IV cho trước (dùng cho test).
func (c *ultraViewerDirectCodec) encryptWithIV(formatFlag bool, payload []byte, iv []byte) ([]byte, error) {
	blockSize := c.block.BlockSize()
	if len(iv) != blockSize {
		return nil, fmt.Errorf("IV phải dài %d byte", blockSize)
	}
	plain := make([]byte, 0, len(payload)+1)
	if formatFlag {
		plain = append(plain, 1)
	} else {
		plain = append(plain, 0)
	}
	plain = append(plain, payload...)

	padded := pkcs7Pad(plain, blockSize)
	out := make([]byte, blockSize+len(padded))
	copy(out[:blockSize], iv)
	cipher.NewCBCEncrypter(c.block, iv).CryptBlocks(out[blockSize:], padded)

	frame := make([]byte, 4+len(out))
	binary.LittleEndian.PutUint32(frame[:4], uint32(len(out)))
	copy(frame[4:], out)
	return frame, nil
}

// decrypt giải mã 1 khung, trả về (format flag, payload).
func (c *ultraViewerDirectCodec) decrypt(frame []byte) (bool, []byte, error) {
	blockSize := c.block.BlockSize()
	if len(frame) < blockSize+1 || (len(frame)-blockSize)%blockSize != 0 {
		return false, nil, fmt.Errorf("khung LAN direct không hợp lệ")
	}
	iv := frame[:blockSize]
	ciphertext := frame[blockSize:]
	plain := make([]byte, len(ciphertext))
	cipher.NewCBCDecrypter(c.block, iv).CryptBlocks(plain, ciphertext)
	unpadded, err := pkcs7Unpad(plain, blockSize)
	if err != nil {
		return false, nil, err
	}
	if len(unpadded) == 0 {
		return false, nil, fmt.Errorf("khung LAN direct rỗng")
	}
	return unpadded[0] > 0, unpadded[1:], nil
}

// pkcs7Pad thêm padding PKCS7.
func pkcs7Pad(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	out := make([]byte, len(data)+padding)
	copy(out, data)
	for i := len(data); i < len(out); i++ {
		out[i] = byte(padding)
	}
	return out
}

// pkcs7Unpad gỡ padding PKCS7.
func pkcs7Unpad(data []byte, blockSize int) ([]byte, error) {
	if len(data) == 0 || len(data)%blockSize != 0 {
		return nil, fmt.Errorf("padding không hợp lệ")
	}
	padding := int(data[len(data)-1])
	if padding == 0 || padding > blockSize || padding > len(data) {
		return nil, fmt.Errorf("padding không hợp lệ")
	}
	for _, b := range data[len(data)-padding:] {
		if int(b) != padding {
			return nil, fmt.Errorf("padding không hợp lệ")
		}
	}
	return data[:len(data)-padding], nil
}

// ultraViewerDirect là listener LAN đang chờ máy đối tác kết nối.
type ultraViewerDirect struct {
	listener *net.TCPListener
	codec    *ultraViewerDirectCodec
	port     int
	mu       sync.Mutex
	closed   bool
}

// startUltraViewerDirect mở listener trên IP LAN và chờ máy đối tác kết nối.
func startUltraViewerDirect(localIP string, key string) (*ultraViewerDirect, error) {
	if localIP == "" {
		return nil, fmt.Errorf("không có địa chỉ LAN")
	}
	address := net.ParseIP(localIP)
	if address == nil || address.To4() == nil {
		return nil, fmt.Errorf("địa chỉ LAN không hợp lệ: %s", localIP)
	}
	codec, err := newUltraViewerDirectCodec(key)
	if err != nil {
		return nil, err
	}
	listener, err := net.ListenTCP("tcp", &net.TCPAddr{IP: address, Port: 0})
	if err != nil {
		return nil, err
	}
	port := listener.Addr().(*net.TCPAddr).Port
	return &ultraViewerDirect{listener: listener, codec: codec, port: port}, nil
}

// close đóng listener.
func (d *ultraViewerDirect) close() {
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.closed {
		return
	}
	d.closed = true
	d.listener.Close()
}

// accept chờ 1 kết nối từ máy đối tác (chỉ nhận kết nối trong mạng LAN riêng).
func (d *ultraViewerDirect) accept(timeout time.Duration) (net.Conn, error) {
	if err := d.listener.SetDeadline(time.Now().Add(timeout)); err != nil {
		return nil, err
	}
	for {
		conn, err := d.listener.Accept()
		if err != nil {
			return nil, err
		}
		// Chỉ nhận kết nối từ mạng LAN riêng (giống client gốc).
		if !isLanRemoteAddr(conn.RemoteAddr()) {
			conn.Close()
			continue
		}
		if tcp, ok := conn.(*net.TCPConn); ok {
			tcp.SetNoDelay(true)
		}
		return conn, nil
	}
}

// ultraViewerDirectChannel là kết nối đã thiết lập với máy đối tác.
type ultraViewerDirectChannel struct {
	conn   net.Conn
	codec  *ultraViewerDirectCodec
	mu     sync.Mutex
	frames ultraViewerFrameBuffer
}

// close đóng kết nối tới máy đối tác.
func (c *ultraViewerDirectChannel) close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.conn.Close()
}

// write nhận byte thô từ trình duyệt (dạng frame length-prefixed), tách từng
// frame rồi mã hoá và gửi xuống máy đối tác.
//
// Mỗi frame của trình duyệt có dạng "[cờ định dạng 1 byte][payload]": byte cờ
// nằm ngoài phần mã hoá, đúng như envelope của client gốc.
func (c *ultraViewerDirectChannel) write(data []byte) error {
	frames, err := c.frames.push(data)
	if err != nil {
		return err
	}
	for _, frame := range frames {
		if len(frame) == 0 {
			continue
		}
		formatFlag := frame[0] > 0
		payload := frame[1:]
		c.mu.Lock()
		err := writeDirectFrame(c.conn, c.codec, formatFlag, payload)
		c.mu.Unlock()
		if err != nil {
			return err
		}
	}
	return nil
}

// ultraViewerFrameBuffer tách chuỗi byte length-prefixed thành các frame.
type ultraViewerFrameBuffer struct {
	buf []byte
}

// push thêm byte mới và trả về các frame hoàn chỉnh.
func (b *ultraViewerFrameBuffer) push(data []byte) ([][]byte, error) {
	b.buf = append(b.buf, data...)
	var frames [][]byte
	for {
		if len(b.buf) < 4 {
			break
		}
		size := int(binary.LittleEndian.Uint32(b.buf[:4]))
		if size == 0 || size > ultraViewerDirectMaxFrame {
			b.buf = nil
			return nil, fmt.Errorf("khung LAN direct không hợp lệ: %d", size)
		}
		if len(b.buf) < 4+size {
			break
		}
		frames = append(frames, b.buf[4:4+size])
		rest := make([]byte, len(b.buf)-(4+size))
		copy(rest, b.buf[4+size:])
		b.buf = rest
	}
	return frames, nil
}

// readDirectFrame đọc 1 khung đã giải mã từ kết nối tới host.
func readDirectFrame(reader io.Reader, codec *ultraViewerDirectCodec) (bool, []byte, error) {
	var length [4]byte
	if _, err := io.ReadFull(reader, length[:]); err != nil {
		return false, nil, err
	}
	size := binary.LittleEndian.Uint32(length[:])
	if size == 0 || size > ultraViewerDirectMaxFrame {
		return false, nil, fmt.Errorf("khung LAN direct có độ dài không hợp lệ: %d", size)
	}
	frame := make([]byte, size)
	if _, err := io.ReadFull(reader, frame); err != nil {
		return false, nil, err
	}
	return codec.decrypt(frame)
}

// writeDirectFrame ghi 1 khung đã mã hoá xuống kết nối tới host.
func writeDirectFrame(writer io.Writer, codec *ultraViewerDirectCodec, formatFlag bool, payload []byte) error {
	frame, err := codec.encrypt(formatFlag, payload)
	if err != nil {
		return err
	}
	_, err = writer.Write(frame)
	return err
}

// randomUltraViewerDirectKey sinh khoá phiên ngẫu nhiên (14 ký tự).
func randomUltraViewerDirectKey() (string, error) {
	buf := make([]byte, 14)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	out := make([]byte, 14)
	for i, b := range buf {
		out[i] = ultraViewerDirectKeyAlphabet[int(b)%len(ultraViewerDirectKeyAlphabet)]
	}
	return string(out), nil
}

// isLanIPv4 kiểm tra địa chỉ mạng riêng (10/8, 172.16/12, 192.168/16,
// 169.254/16) — giống `is_lan_address` của client gốc.
func isLanIPv4(ip net.IP) bool {
	v4 := ip.To4()
	if v4 == nil {
		return false
	}
	switch {
	case v4[0] == 10:
		return true
	case v4[0] == 172 && v4[1] >= 16 && v4[1] <= 31:
		return true
	case v4[0] == 192 && v4[1] == 168:
		return true
	case v4[0] == 169 && v4[1] == 254:
		return true
	}
	return false
}

// isLanRemoteAddr kiểm tra địa chỉ nguồn của kết nối có nằm trong LAN riêng.
func isLanRemoteAddr(addr net.Addr) bool {
	host, _, err := net.SplitHostPort(addr.String())
	if err != nil {
		return false
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	return isLanIPv4(ip)
}

// localLanIPv4Address trả về IPv4 nội bộ (mạng riêng) của máy chạy daemon.
func localLanIPv4Address() string {
	addresses, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, address := range addresses {
		ipNet, ok := address.(*net.IPNet)
		if !ok || ipNet.IP.IsLoopback() {
			continue
		}
		if ipv4 := ipNet.IP.To4(); ipv4 != nil && isLanIPv4(ipv4) {
			return ipv4.String()
		}
	}
	return ""
}

// startDirectListener mở listener LAN cho kênh trực tiếp và báo cho trình
// duyệt biết IP/port/khoá để đưa vào lệnh tra cứu máy đối tác.
func (s *ultraViewerSession) startDirectListener() {
	s.mu.Lock()
	if s.directListener != nil || s.closed {
		s.mu.Unlock()
		return
	}
	s.mu.Unlock()

	ip := localLanIPv4Address()
	if ip == "" {
		s.writer.writeControl(ultraViewerControlMessage{
			Type:    "listen_err",
			Channel: ultraViewerDirectChannelID,
			Message: "Máy này không có địa chỉ mạng LAN riêng nào.",
		})
		return
	}
	key, err := randomUltraViewerDirectKey()
	if err != nil {
		s.writer.writeControl(ultraViewerControlMessage{
			Type:    "listen_err",
			Channel: ultraViewerDirectChannelID,
			Message: "Không sinh được khoá cho kênh LAN trực tiếp.",
		})
		return
	}
	listener, err := startUltraViewerDirect(ip, key)
	if err != nil {
		s.writer.writeControl(ultraViewerControlMessage{
			Type:    "listen_err",
			Channel: ultraViewerDirectChannelID,
			Message: fmt.Sprintf("Không mở được cổng lắng nghe LAN: %v", err),
		})
		return
	}

	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		listener.close()
		return
	}
	s.directListener = listener
	s.mu.Unlock()

	s.writer.writeControl(ultraViewerControlMessage{
		Type:    "listen_ok",
		Channel: ultraViewerDirectChannelID,
		IP:      ip,
		Port:    listener.port,
		Key:     key,
	})
	tm_common.LogInfo(fmt.Sprintf("[UltraViewer] Đã mở listener LAN trực tiếp tại %s:%d", ip, listener.port))

	go s.acceptDirect(listener)
}

// acceptDirect chờ máy đối tác kết nối thẳng vào listener LAN.
func (s *ultraViewerSession) acceptDirect(listener *ultraViewerDirect) {
	conn, err := listener.accept(ultraViewerDirectAcceptTimeout)
	if err != nil {
		// Hết thời gian chờ hoặc listener đã bị đóng → không còn dùng nữa.
		listener.close()
		s.mu.Lock()
		if s.directListener == listener {
			s.directListener = nil
		}
		s.mu.Unlock()
		if !isClosedConnError(err) {
			tm_common.LogInfo(fmt.Sprintf("[UltraViewer] Không có máy đối tác kết nối LAN trực tiếp: %v", err))
		}
		return
	}
	channel := &ultraViewerDirectChannel{conn: conn, codec: listener.codec}

	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		channel.close()
		return
	}
	previous := s.directChannel
	s.directChannel = channel
	s.mu.Unlock()
	if previous != nil {
		previous.close()
	}

	remoteIP := ""
	if host, _, err := net.SplitHostPort(conn.RemoteAddr().String()); err == nil {
		remoteIP = host
	}
	tm_common.LogInfo(fmt.Sprintf("[UltraViewer] Máy đối tác đã kết nối LAN trực tiếp từ %s", remoteIP))
	s.writer.writeControl(ultraViewerControlMessage{
		Type:    "direct_connected",
		Channel: ultraViewerDirectChannelID,
		IP:      remoteIP,
	})

	go s.pumpDirectToBrowser(channel)
}

// pumpDirectToBrowser đọc khung từ máy đối tác, giải mã rồi đẩy cho trình
// duyệt (dạng frame length-prefixed để khớp bộ tách khung phía WASM).
func (s *ultraViewerSession) pumpDirectToBrowser(channel *ultraViewerDirectChannel) {
	defer func() {
		channel.close()
		s.mu.Lock()
		if s.directChannel == channel {
			s.directChannel = nil
		}
		s.mu.Unlock()
		s.writer.writeControl(ultraViewerControlMessage{
			Type:    "closed",
			Channel: ultraViewerDirectChannelID,
			Message: "Kết nối LAN trực tiếp đã đóng.",
		})
	}()
	for {
		formatFlag, payload, err := readDirectFrame(channel.conn, channel.codec)
		if err != nil {
			return
		}
		// Đưa byte cờ định dạng ra ngoài phần mã hoá để trình duyệt xử lý
		// giống hệt kênh relay.
		message := make([]byte, 0, len(payload)+1)
		if formatFlag {
			message = append(message, 1)
		} else {
			message = append(message, 0)
		}
		message = append(message, payload...)
		frame := make([]byte, 4+len(message))
		binary.LittleEndian.PutUint32(frame[:4], uint32(len(message)))
		copy(frame[4:], message)
		out := make([]byte, 1+len(frame))
		out[0] = ultraViewerDirectChannelID
		copy(out[1:], frame)
		if err := s.writer.writeBinary(out); err != nil {
			return
		}
	}
}

// closeDirectListener đóng listener LAN (giữ nguyên kết nối đã thiết lập).
func (s *ultraViewerSession) closeDirectListener() {
	s.mu.Lock()
	listener := s.directListener
	s.directListener = nil
	s.mu.Unlock()
	if listener != nil {
		listener.close()
		tm_common.LogInfo("[UltraViewer] Đã đóng listener LAN trực tiếp")
	}
}

// closeDirect đóng listener LAN và kết nối trực tiếp (nếu có).
func (s *ultraViewerSession) closeDirect() {
	s.mu.Lock()
	listener := s.directListener
	channel := s.directChannel
	s.directListener = nil
	s.directChannel = nil
	s.mu.Unlock()
	if listener != nil {
		listener.close()
	}
	if channel != nil {
		channel.close()
	}
}
