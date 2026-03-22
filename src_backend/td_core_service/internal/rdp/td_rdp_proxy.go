package rdp

import (
	"crypto/tls"
	"encoding/asn1"
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/gorilla/websocket"
)

// ─── ASN.1 structures cho RDCleanPath protocol ────────────────────────────────

// Version RDCleanPath = 3390 (3389+1)
const rdCleanPathVersion = 3390

// RDCleanPath Request PDU (parse từ binary DER)
type rdCleanPathRequest struct {
	Destination         string
	ProxyAuth           string
	X224ConnectionReq   []byte
	PreConnectionBlob   string
}

// upgrader cho WebSocket
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // cho phép cross-origin
	},
	ReadBufferSize:  65536,
	WriteBufferSize: 65536,
}

// ─── Handler chính ────────────────────────────────────────────────────────────

// HandleRDPWebSocket xử lý upgrade HTTP → WebSocket, sau đó thực hiện RDCleanPath proxy
func HandleRDPWebSocket(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[RDP] WebSocket upgrade failed: %v", err)
		return
	}
	defer ws.Close()
	log.Println("[RDP] New WebSocket connection")

	// Đọc message đầu tiên: RDCleanPath Request (binary DER)
	messageType, data, err := ws.ReadMessage()
	if err != nil {
		log.Printf("[RDP] Failed to read initial message: %v", err)
		return
	}
	if messageType != websocket.BinaryMessage {
		log.Printf("[RDP] Expected binary message, got type %d", messageType)
		sendRDPError(ws, 1, 400)
		return
	}

	log.Printf("[RDP] Received RDCleanPath request (%d bytes)", len(data))

	// Parse RDCleanPath request
	req, err := parseRDCleanPathRequest(data)
	if err != nil {
		log.Printf("[RDP] Parse error: %v", err)
		sendRDPError(ws, 1, 502)
		return
	}
	log.Printf("[RDP] Destination: %s", req.Destination)

	// Parse host:port
	host, port, err := parseDestination(req.Destination)
	if err != nil {
		log.Printf("[RDP] Invalid destination: %v", err)
		sendRDPError(ws, 1, 400)
		return
	}

	// Thực hiện TCP → X.224 → TLS handshake
	addr := fmt.Sprintf("%s:%d", host, port)
	x224Resp, certChain, tlsConn, err := performRDPHandshake(addr, req.X224ConnectionReq)
	if err != nil {
		log.Printf("[RDP] Handshake failed: %v", err)
		sendRDPError(ws, 2, 502)
		return
	}
	defer tlsConn.Close()

	// Build và gửi RDCleanPath Response
	respPDU, err := buildRDCleanPathResponse(addr, x224Resp, certChain)
	if err != nil {
		log.Printf("[RDP] Build response error: %v", err)
		sendRDPError(ws, 1, 500)
		return
	}
	if err := ws.WriteMessage(websocket.BinaryMessage, respPDU); err != nil {
		log.Printf("[RDP] Send response error: %v", err)
		return
	}
	log.Printf("[RDP] RDCleanPath handshake done — starting relay")

	// Bidirectional relay: WebSocket ↔ TLS
	setupRelay(ws, tlsConn)
}

// ─── TCP + X.224 + TLS handshake ──────────────────────────────────────────────

func performRDPHandshake(addr string, x224Req []byte) (x224Resp []byte, certChain [][]byte, tlsConn *tls.Conn, err error) {
	// 1. TCP connect
	tcpConn, err := net.Dial("tcp", addr)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("TCP connect: %w", err)
	}

	// 2. Gửi X.224 Connection Request
	if _, err = tcpConn.Write(x224Req); err != nil {
		tcpConn.Close()
		return nil, nil, nil, fmt.Errorf("X.224 write: %w", err)
	}

	// 3. Đọc X.224 Connection Confirm
	buf := make([]byte, 4096)
	n, err := tcpConn.Read(buf)
	if err != nil || n == 0 {
		tcpConn.Close()
		return nil, nil, nil, fmt.Errorf("X.224 read: %w", err)
	}
	x224Resp = make([]byte, n)
	copy(x224Resp, buf[:n])
	log.Printf("[RDP] X.224 confirm received (%d bytes)", n)

	// 4. TLS upgrade trên connection TCP đã có
	host, _, _ := net.SplitHostPort(addr)
	tlsConn = tls.Client(tcpConn, &tls.Config{
		ServerName:         host,
		InsecureSkipVerify: true, // RDP server dùng self-signed cert
	})
	if err = tlsConn.Handshake(); err != nil {
		tlsConn.Close()
		return nil, nil, nil, fmt.Errorf("TLS handshake: %w", err)
	}
	log.Println("[RDP] TLS handshake done")

	// 5. Extract cert chain
	for _, cert := range tlsConn.ConnectionState().PeerCertificates {
		certChain = append(certChain, cert.Raw)
	}
	log.Printf("[RDP] Extracted %d certificate(s)", len(certChain))

	return x224Resp, certChain, tlsConn, nil
}

// ─── Bidirectional relay ───────────────────────────────────────────────────────

func setupRelay(ws *websocket.Conn, tlsConn *tls.Conn) {
	done := make(chan struct{})

	// TLS → WebSocket
	go func() {
		defer close(done)
		buf := make([]byte, 65536)
		for {
			n, err := tlsConn.Read(buf)
			if n > 0 {
				if werr := ws.WriteMessage(websocket.BinaryMessage, buf[:n]); werr != nil {
					log.Printf("[RDP relay] TLS→WS write error: %v", werr)
					return
				}
			}
			if err != nil {
				log.Printf("[RDP relay] TLS closed: %v", err)
				return
			}
		}
	}()

	// WebSocket → TLS
	for {
		_, data, err := ws.ReadMessage()
		if err != nil {
			log.Printf("[RDP relay] WS closed: %v", err)
			break
		}
		if _, werr := tlsConn.Write(data); werr != nil {
			log.Printf("[RDP relay] WS→TLS write error: %v", werr)
			break
		}
	}
	<-done
}

// ─── RDCleanPath ASN.1 DER parsing & encoding ─────────────────────────────────

// rawRDCleanPathOuter dùng để decode outer SEQUENCE với các trường context-specific (raw)
type rawTaggedField struct {
	Class       int
	Tag         int
	IsCompound  bool
	Bytes       []byte
	FullBytes   []byte
}

func parseRDCleanPathRequest(data []byte) (*rdCleanPathRequest, error) {
	// Dùng asn1.RawValue để decode linh hoạt
	var outer asn1.RawValue
	rest, err := asn1.Unmarshal(data, &outer)
	if err != nil {
		return nil, fmt.Errorf("unmarshal outer: %w", err)
	}
	_ = rest

	if outer.Class != asn1.ClassUniversal || outer.Tag != asn1.TagSequence {
		return nil, fmt.Errorf("expected SEQUENCE, got class=%d tag=%d", outer.Class, outer.Tag)
	}

	// Parse các children trong outer SEQUENCE
	req := &rdCleanPathRequest{}
	remaining := outer.Bytes
	for len(remaining) > 0 {
		var field asn1.RawValue
		remaining, err = asn1.Unmarshal(remaining, &field)
		if err != nil {
			break
		}
		if field.Class != asn1.ClassContextSpecific {
			continue
		}
		switch field.Tag {
		case 0: // version (INTEGER)
			var ver int
			if _, e := asn1.Unmarshal(field.Bytes, &ver); e == nil {
				if ver != rdCleanPathVersion {
					return nil, fmt.Errorf("unsupported version: %d", ver)
				}
			}
		case 2: // destination (UTF8String)
			var s string
			if _, e := asn1.Unmarshal(field.Bytes, &s); e == nil {
				req.Destination = s
			}
		case 3: // proxy_auth (UTF8String)
			var s string
			if _, e := asn1.Unmarshal(field.Bytes, &s); e == nil {
				req.ProxyAuth = s
			}
		case 5: // preconnection_blob (UTF8String)
			var s string
			if _, e := asn1.Unmarshal(field.Bytes, &s); e == nil {
				req.PreConnectionBlob = s
			}
		case 6: // x224_connection_pdu (OCTET STRING)
			var b []byte
			if _, e := asn1.Unmarshal(field.Bytes, &b); e == nil {
				req.X224ConnectionReq = b
			}
		}
	}

	if req.Destination == "" {
		return nil, fmt.Errorf("missing destination")
	}
	if len(req.X224ConnectionReq) == 0 {
		return nil, fmt.Errorf("missing x224_connection_pdu")
	}

	return req, nil
}

func buildRDCleanPathResponse(serverAddr string, x224Resp []byte, certChain [][]byte) ([]byte, error) {
	// [0] version
	versionField, err := marshalContextExplicit(0, marshalInteger(rdCleanPathVersion))
	if err != nil {
		return nil, err
	}

	// [6] x224_connection_pdu (OCTET STRING)
	x224Field, err := marshalContextExplicit(6, marshalOctetString(x224Resp))
	if err != nil {
		return nil, err
	}

	// [7] server_cert_chain (SEQUENCE OF OCTET STRING)
	var certOctets []byte
	for _, cert := range certChain {
		certOctets = append(certOctets, marshalOctetString(cert)...)
	}
	certSeq := marshalSequence(certOctets)
	certField, err := marshalContextExplicit(7, certSeq)
	if err != nil {
		return nil, err
	}

	// [9] server_addr (UTF8String)
	addrField, err := marshalContextExplicit(9, marshalUTF8String(serverAddr))
	if err != nil {
		return nil, err
	}

	body := concat(versionField, x224Field, certField, addrField)
	return marshalSequence(body), nil
}

func sendRDPError(ws *websocket.Conn, errorCode, httpStatus int) {
	// [0] version  [1] error: SEQUENCE{ [0] errorCode, [1] httpStatus }
	errBody := concat(
		mustMarshalContextExplicit(0, marshalInteger(errorCode)),
		mustMarshalContextExplicit(1, marshalInteger(httpStatus)),
	)
	errSeq := marshalSequence(errBody)
	pdu := marshalSequence(concat(
		mustMarshalContextExplicit(0, marshalInteger(rdCleanPathVersion)),
		mustMarshalContextExplicit(1, errSeq),
	))
	_ = ws.WriteMessage(websocket.BinaryMessage, pdu)
}

// ─── ASN.1 DER low-level helpers ──────────────────────────────────────────────

func derEncodeLength(n int) []byte {
	if n < 0x80 {
		return []byte{byte(n)}
	}
	var tmp []byte
	for n > 0 {
		tmp = append([]byte{byte(n & 0xff)}, tmp...)
		n >>= 8
	}
	return append([]byte{byte(0x80 | len(tmp))}, tmp...)
}

func derWrap(tag byte, content []byte) []byte {
	out := []byte{tag}
	out = append(out, derEncodeLength(len(content))...)
	out = append(out, content...)
	return out
}

func marshalSequence(body []byte) []byte {
	return derWrap(0x30, body)
}

func marshalOctetString(b []byte) []byte {
	return derWrap(0x04, b)
}

func marshalUTF8String(s string) []byte {
	return derWrap(0x0c, []byte(s))
}

func marshalInteger(v int) []byte {
	if v == 0 {
		return derWrap(0x02, []byte{0})
	}
	var tmp []byte
	for v > 0 {
		tmp = append([]byte{byte(v & 0xff)}, tmp...)
		v >>= 8
	}
	if tmp[0]&0x80 != 0 {
		tmp = append([]byte{0}, tmp...)
	}
	return derWrap(0x02, tmp)
}

func marshalContextExplicit(tag int, inner []byte) ([]byte, error) {
	return derWrap(byte(0xa0|tag), inner), nil
}

func mustMarshalContextExplicit(tag int, inner []byte) []byte {
	b, _ := marshalContextExplicit(tag, inner)
	return b
}

func concat(parts ...[]byte) []byte {
	var out []byte
	for _, p := range parts {
		out = append(out, p...)
	}
	return out
}

// ─── Destination parsing ───────────────────────────────────────────────────────

func parseDestination(destination string) (host string, port int, err error) {
	h, p, e := net.SplitHostPort(destination)
	if e != nil {
		return "", 0, fmt.Errorf("invalid destination %q: %w", destination, e)
	}
	var portNum int
	_, err = fmt.Sscanf(p, "%d", &portNum)
	if err != nil {
		return "", 0, fmt.Errorf("invalid port %q", p)
	}
	return h, portNum, nil
}
