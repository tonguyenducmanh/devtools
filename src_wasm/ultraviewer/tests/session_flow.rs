//! Kiểm thử end-to-end luồng phiên UltraViewer với một relay giả lập.
//!
//! Mô phỏng đúng những gì relay UltraViewer thật làm:
//!   1. nhận lệnh đăng ký (lệnh "3", mã hoá 3DES) → trả lời "3:..."
//!   2. nhận lệnh tra cứu (lệnh "8") → trả lời "8:..." kèm địa chỉ relay
//!   3. nhận lệnh "login" trên kênh dữ liệu → gửi màn hình (lệnh 0)
//!   4. gửi khung hình (lệnh 1) → kiểm tra canvas đã vẽ đúng vùng đổi
//!
//! Test chạy native (không cần trình duyệt) vì phần giao thức là Rust thuần.

use std::cell::RefCell;
use std::rc::Rc;

use ultraviewer_client::messages::CLIENT_VERSION;
use ultraviewer_client::screen::Rect;
use ultraviewer_client::session::{ConnectOptions, Session, SessionObserver};
use ultraviewer_client::transport::{Relay, SessionEvent, CHANNEL_COMMAND, CHANNEL_DIRECT, CHANNEL_PEER};
use ultraviewer_client::wire::{
    decode_envelope, encode_frame, encode_multipart, forward_envelope, system_envelope, CommandCipher, Envelope, Ipv4,
};

// ───────────────────────────── Relay giả lập ─────────────────────────────

#[derive(Default)]
struct MockState {
    /// (channel, byte thô đã gửi đi)
    sent: Vec<(u8, Vec<u8>)>,
    /// Sự kiện sẽ đưa vào phiên ở lượt pump tiếp theo.
    pending: Vec<SessionEvent>,
    /// Các kênh đã được yêu cầu mở.
    opened: Vec<(u8, String, u16, String)>,
    /// Kênh đã gửi header HTTP (relay chỉ trả header một lần, ở đầu kênh).
    http_sent: Vec<u8>,
    /// Số lần yêu cầu mở listener LAN.
    direct_listens: usize,
    /// Đã yêu cầu đóng listener LAN.
    direct_listener_closed: bool,
}

struct MockRelay {
    state: Rc<RefCell<MockState>>,
}

impl Relay for MockRelay {
    fn open(&mut self, channel: u8, host: &str, port: u16, cert_host: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut state = self.state.borrow_mut();
        state.opened.push((channel, host.to_string(), port, cert_host.to_string()));
        state.pending.push(SessionEvent::Opened { channel });
        Ok(())
    }

    fn write(&mut self, channel: u8, bytes: &[u8]) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.state.borrow_mut().sent.push((channel, bytes.to_vec()));
        Ok(())
    }

    fn close(&mut self, _channel: u8) {}

    fn listen_direct(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        self.state.borrow_mut().direct_listens += 1;
        Ok(())
    }

    fn close_direct_listener(&mut self) {
        self.state.borrow_mut().direct_listener_closed = true;
    }
}

/// Ghi lại các sự kiện mà phiên phát ra.
#[derive(Default)]
struct Recorder {
    status: Vec<String>,
    connected: Vec<(u32, u32)>,
    view_only: Vec<bool>,
    frames: usize,
    chat: Vec<String>,
    closed: Vec<String>,
}

impl SessionObserver for Recorder {
    fn status(&mut self, message: &str) {
        self.status.push(message.to_string());
    }
    fn connected(&mut self, width: u32, height: u32) {
        self.connected.push((width, height));
    }
    fn view_only(&mut self, view_only: bool) {
        self.view_only.push(view_only);
    }
    fn frame(&mut self) {
        self.frames += 1;
    }
    fn chat(&mut self, text: &str) {
        self.chat.push(text.to_string());
    }
    fn closed(&mut self, message: &str) {
        self.closed.push(message.to_string());
    }
}

// ───────────────────────────── Tiện ích ─────────────────────────────

/// Header HTTP mà relay trả về trước khi các frame bắt đầu.
const HTTP_REPLY: &[u8] = b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n";

/// Bọc payload của máy đối tác trong forward envelope, đúng như relay làm
/// (địa chỉ/port là của máy đối tác trong lệnh tra cứu).
fn peer_frame(payload: &[u8]) -> Vec<u8> {
    forward_envelope(Ipv4::parse("203.0.113.9").unwrap(), 55100, false, payload)
}

fn push_data(state: &Rc<RefCell<MockState>>, channel: u8, frame: &[u8]) {
    let mut state = state.borrow_mut();
    let mut payload = Vec::new();
    if !state.http_sent.contains(&channel) {
        // Relay chỉ trả header HTTP một lần, ở đầu kênh.
        state.http_sent.push(channel);
        payload.extend_from_slice(HTTP_REPLY);
    }
    payload.extend_from_slice(&encode_frame(frame));
    state.pending.push(SessionEvent::Data { channel, bytes: payload });
}

/// Đưa dữ liệu đến từ kênh LAN trực tiếp (không có header HTTP, payload
/// bắt đầu bằng byte cờ định dạng).
fn push_direct_data(state: &Rc<RefCell<MockState>>, payload: &[u8]) {
    let mut state = state.borrow_mut();
    let mut frame = vec![0u8];
    frame.extend_from_slice(payload);
    state.pending.push(SessionEvent::Data {
        channel: CHANNEL_DIRECT,
        bytes: encode_frame(&frame),
    });
}

/// Đưa các sự kiện đang chờ vào phiên. Lặp lại vì một sự kiện có thể sinh ra
/// sự kiện mới (vd: mở kênh lệnh → phát sinh yêu cầu mở kênh dữ liệu).
fn pump(session: &mut Session, state: &Rc<RefCell<MockState>>) {
    for _ in 0..16 {
        let pending = std::mem::take(&mut state.borrow_mut().pending);
        if pending.is_empty() {
            break;
        }
        for event in pending {
            session.handle(event, 1_000.0);
        }
    }
}

/// Lấy nội dung lệnh đã mã hoá gần nhất gửi lên kênh lệnh (đã giải mã).
fn last_command_text(state: &Rc<RefCell<MockState>>) -> String {
    let sent = state.borrow().sent.clone();
    let (_, bytes) = sent
        .iter()
        .rev()
        .find(|(channel, bytes)| *channel == CHANNEL_COMMAND && bytes_look_like_command(bytes))
        .expect("không tìm thấy lệnh nào gửi lên kênh lệnh");
    // bytes = length-prefixed frame -> system envelope -> ciphertext
    let frame = &bytes[4..];
    let Envelope::System(payload) = decode_envelope(frame).expect("envelope không hợp lệ") else {
        panic!("lệnh phải nằm trong system envelope");
    };
    // system envelope có flag byte 0 ở vị trí 1
    let ciphertext = &payload[1..];
    let plain = CommandCipher::server().decrypt(ciphertext).expect("giải mã lệnh thất bại");
    String::from_utf8(plain).expect("lệnh phải là ASCII")
}

/// Heuristic: frame của lệnh bắt đầu bằng system envelope `[1, 0]`.
fn bytes_look_like_command(bytes: &[u8]) -> bool {
    bytes.len() > 5 && bytes[4] == 1 && bytes[5] == 0
}

/// Lấy toạ độ correlation trong lệnh tra cứu (trường thứ 10, đánh số từ 0).
fn lookup_correlation(text: &str) -> i32 {
    text.split(':').nth(9).expect("lệnh tra cứu thiếu trường").parse().expect("correlation không phải số")
}

/// Dựng zstd frame "raw" (không nén) cho vài byte RGB555.
fn raw_zstd(bytes: &[u8]) -> Vec<u8> {
    assert!(bytes.len() < 256, "payload test quá lớn cho block raw");
    let block = (bytes.len() << 3) | 1;
    let mut out = vec![0x28, 0xb5, 0x2f, 0xfd, 0x20, bytes.len() as u8, block as u8, (block >> 8) as u8, 0];
    out.extend_from_slice(bytes);
    out
}

fn words(values: &[u16]) -> Vec<u8> {
    values.iter().flat_map(|v| v.to_le_bytes()).collect()
}

fn long(value: i32) -> Vec<u8> {
    value.to_le_bytes().to_vec()
}

/// Màn hình (lệnh 0) của máy đối tác.
fn screen_init_parts(width: i32, height: i32) -> Vec<Vec<u8>> {
    let mut parts = vec![
        vec![0u8],
        long(width),
        long(height),
        vec![],
        vec![],
        vec![0],           // 5: phải khác rỗng
        b"6.6.125".to_vec(), // 6: phiên bản
        vec![1],           // 7: phải khác rỗng
        b"monitor".to_vec(), // 8: thông tin màn hình
        long(0),           // 9: gốc ảo bên trái
        long(0),           // 10: gốc ảo bên trên
        vec![0],           // 11: phải khác rỗng
        words(&[0xffff]),  // 12: ít nhất 2 byte
        vec![3],           // 13: phải khác rỗng khi đổi kích thước
        vec![16],          // 14: kích thước tile
    ];
    parts.truncate(15);
    parts
}

/// Khung hình (lệnh 1): một hình chữ nhật RGB555 4x2.
fn screen_frame_parts(frame_number: i32) -> Vec<Vec<u8>> {
    let pixels = words(&[0x7c00, 0x03e0, 0x001f, 0x7fff, 0x0000, 0x7c00, 0x03e0, 0x001f]);
    vec![
        vec![1],                 // 0: lệnh
        words(&[0, 0, 4, 2]),    // 1: hình chữ nhật chính
        raw_zstd(&pixels),       // 2: pixel nén
        vec![],                  // 3
        long(frame_number),      // 4: số thứ tự khung
        vec![],                  // 5: copy từ bộ đệm tạm
        vec![],                  // 6: cuộn
        vec![],                  // 7: atlas JPEG
        vec![],                  // 8: hình chữ nhật atlas
        vec![],                  // 9: tham chiếu cache
        vec![],                  // 10: bổ sung cache
    ]
}


/// Lấy các payload gửi lên kênh dữ liệu (bỏ qua HTTP preamble vì nó không
/// phải frame).
fn peer_payloads(sent: &[(u8, Vec<u8>)]) -> Vec<Vec<u8>> {
    sent.iter()
        .filter(|(channel, _)| *channel == CHANNEL_PEER)
        .filter_map(|(_, bytes)| {
            if bytes.len() < 9 {
                return None;
            }
            // Frame length-prefixed: byte đầu của envelope là 0 (forward) hoặc 1 (system).
            if bytes[4] != 0 && bytes[4] != 1 {
                return None;
            }
            match decode_envelope(&bytes[4..]) {
                Ok(Envelope::Forward { payload, .. }) => Some(payload.to_vec()),
                _ => None,
            }
        })
        .collect()
}


/// Màn hình khởi tạo (lệnh 0) với 2 màn hình nằm cạnh nhau.
fn screen_init_two_monitors() -> Vec<Vec<u8>> {
    // 2 màn hình cạnh nhau → ảnh desktop ảo rộng 3840.
    let mut parts = screen_init_parts(3840, 1080);
    // part 8: "left:top:right:bottom|..." (toạ độ bàn phím ảo)
    parts[8] = b"0:0:1920:1080|1920:0:3840:1080|".to_vec();
    parts
}

// ───────────────────────────── Test ─────────────────────────────

#[test]
fn full_session_flow_reaches_screen_and_input() {
    let state = Rc::new(RefCell::new(MockState::default()));
    let recorder = Rc::new(RefCell::new(Recorder::default()));
    let options = ConnectOptions {
        partner_id: "123456789".into(),
        password: "secret".into(),
        display_name: "DevTools".into(),
        device_identity: "A".repeat(32),
        device_password: "12345678".into(),
        local_screen: (1920, 1080),
        tz_offset_minutes: 420,
        local_ip: "192.0.2.10".into(),
        allow_direct: true,
    };

    let mut session = Session::new(
        Box::new(MockRelay { state: state.clone() }),
        Box::new(ObserverProxy { recorder: recorder.clone() }),
        options,
    )
    .expect("tạo phiên thất bại");

    // ── Bước 1: mở kênh lệnh và đăng ký ────────────────────────────────
    session.start(0.0).expect("mở phiên thất bại");
    pump(&mut session, &state);

    let opened = state.borrow().opened.clone();
    assert_eq!(opened.len(), 1);
    assert_eq!(opened[0].0, CHANNEL_COMMAND);
    assert_eq!(opened[0].1, "functions3.ultraviewer.net");
    assert_eq!(opened[0].2, 443);
    assert_eq!(opened[0].3, "functions3.ultraviewer.net");

    // Lệnh đăng ký phải là lệnh "3" mã hoá 3DES.
    let registration = last_command_text(&state);
    let fields: Vec<&str> = registration.split(':').collect();
    assert_eq!(fields.len(), 28);
    assert_eq!(fields[0], "3");
    assert_eq!(fields[1], "A".repeat(32));
    assert_eq!(fields[2], "12345678");
    assert_eq!(fields[4], "192.0.2.10");
    assert_eq!(fields[7], CLIENT_VERSION);

    // ── Bước 2: relay trả lời đăng ký ─────────────────────────────────
    push_data(
        &state,
        CHANNEL_COMMAND,
        &system_envelope(b"3:443:00111222333:203.0.113.7::0:ping-list:-1:17/10/2026:relay.example:opaque-token", false),
    );
    pump(&mut session, &state);

    // ── Bước 3: lệnh tra cứu máy đối tác ───────────────────────────────
    let lookup = last_command_text(&state);
    let lookup_fields: Vec<&str> = lookup.split(':').collect();
    assert_eq!(lookup_fields.len(), 17);
    assert_eq!(lookup_fields[0], "8");
    assert_eq!(lookup_fields[1], "123456789");
    let correlation = lookup_correlation(&lookup);

    let reply = format!(
        "8:1:192.0.2.9:unused:203.0.113.9:54000:5900:5901:TmFtZQ==:55100:unused:198.51.100.2:-1:123:relay.example:x:x:x:x:x:secret:direct-info:{correlation}"
    );
    push_data(&state, CHANNEL_COMMAND, &system_envelope(reply.as_bytes(), false));
    pump(&mut session, &state);

    // ── Bước 4: mở kênh dữ liệu tới relay của máy đối tác ────────────
    let opened = state.borrow().opened.clone();
    assert_eq!(opened.len(), 2);
    assert_eq!(opened[1].0, CHANNEL_PEER);
    assert_eq!(opened[1].1, "198.51.100.2");
    assert_eq!(opened[1].2, 443);
    assert_eq!(opened[1].3, "relay.example");

    // Lệnh login phải được bọc trong forward envelope tới IP/port của đối tác.
    let login_frame = {
        let sent = state.borrow().sent.clone();
        let (_, bytes) = sent
            .iter()
            .rev()
            .find(|(channel, bytes)| *channel == CHANNEL_PEER && bytes.len() > 12 && bytes[4] == 0)
            .expect("không tìm thấy lệnh login");
        bytes[4..].to_vec()
    };
    let Envelope::Forward { ip, port, payload } = decode_envelope(&login_frame).expect("login phải là forward envelope")
    else {
        panic!("login phải là forward envelope");
    };
    assert_eq!(ip.to_string(), "203.0.113.9");
    assert_eq!(port, 55100);
    let login = String::from_utf8(payload.to_vec()).expect("login phải là ASCII");
    let login_fields: Vec<&str> = login.split(':').collect();
    assert_eq!(login_fields.len(), 23);
    assert_eq!(login_fields[0], "login");
    assert_eq!(login_fields[10], "111222333");

    // ── Bước 5: máy đối tác gửi màn hình (lệnh 0) ──────────────────────
    let init = screen_init_parts(8, 4);
    let init_refs: Vec<&[u8]> = init.iter().map(|p| p.as_slice()).collect();
    push_data(&state, CHANNEL_PEER, &peer_frame(&encode_multipart(&init_refs)));
    pump(&mut session, &state);

    assert_eq!(recorder.borrow().connected, vec![(8, 4)]);
    assert!(session.is_connected());
    assert_eq!(session.screen_size(), (8, 4));

    // Sau khi khởi tạo, viewer phải trả lời "17" và bật báo vị trí con trỏ.
    let sent = state.borrow().sent.clone();
    let payloads = peer_payloads(&sent);
    assert!(payloads.iter().any(|p| p == b"17"));
    assert!(payloads.iter().any(|p| p == b"28|||1"));

    // ── Bước 6: máy đối tác gửi khung hình (lệnh 1) ────────────────────
    let frame = screen_frame_parts(-2_147_483_646);
    let frame_refs: Vec<&[u8]> = frame.iter().map(|p| p.as_slice()).collect();
    push_data(&state, CHANNEL_PEER, &peer_frame(&encode_multipart(&frame_refs)));
    pump(&mut session, &state);

    assert_eq!(recorder.borrow().frames, 1);
    // Vùng đổi phải đúng hình chữ nhật 4x2 ở góc trên trái.
    let dirty = session.take_dirty();
    assert_eq!(dirty.len(), 1);
    assert_eq!(dirty[0], Rect { x: 0, y: 0, width: 4, height: 2 });
    // Pixel RGBA của hình chữ nhật: 4x2x4 byte.
    let pixels = session.region_pixels(dirty[0]).unwrap();
    assert_eq!(pixels.len(), 4 * 2 * 4);
    // RGB555: 0x7c00 = đỏ, 0x03e0 = xanh lá, 0x001f = xanh dương.
    assert_eq!(&pixels[0..4], &[255, 0, 0, 255]);
    assert_eq!(&pixels[4..8], &[0, 255, 0, 255]);
    assert_eq!(&pixels[8..12], &[0, 0, 255, 255]);
    assert_eq!(&pixels[12..16], &[255, 255, 255, 255]);

    // Backpressure: viewer phải gửi "18" sau khi giải mã xong.
    let sent = state.borrow().sent.clone();
    let has_ack = sent.iter().filter(|(channel, _)| *channel == CHANNEL_PEER).any(|(_, bytes)| {
        let frame = &bytes[4..];
        matches!(decode_envelope(frame), Ok(Envelope::Forward { payload, .. }) if payload == b"18")
    });
    assert!(has_ack, "viewer phải gửi '18' sau khi giải mã khung hình");

    // ── Bước 7: gửi chuột và bàn phím ──────────────────────────────────
    let before = state.borrow().sent.len();
    session.on_pointer_move(3, 1);
    session.on_pointer_button(0, true, 3, 1);
    session.on_key("KeyA", true, Some("a"));
    session.on_wheel(1.0);
    let sent = state.borrow().sent.clone();
    assert!(sent.len() > before);
    let peer_payloads = peer_payloads(&sent);
    // Chuột di chuyển: "8|||512|||flags|||x|||y"
    assert!(peer_payloads.iter().any(|p| p.starts_with(b"8|||512|||")));
    // Phím A: 11 byte với kind = 1 (key down).
    assert!(peer_payloads.iter().any(|p| p.len() == 11 && p[4] == 1 && p[5] == 0x41));

    // ── Bước 8: máy đối tác thu hồi quyền điều khiển (lệnh 49) ────────
    let mut parts: Vec<Vec<u8>> = Vec::new();
    parts.push(vec![49]);
    parts.push(vec![1]);
    let parts_refs: Vec<&[u8]> = parts.iter().map(|p| p.as_slice()).collect();
    push_data(&state, CHANNEL_PEER, &peer_frame(&encode_multipart(&parts_refs)));
    pump(&mut session, &state);
    assert!(session.is_view_only());
    assert_eq!(recorder.borrow().view_only.last(), Some(&true));

    // Khi chỉ xem thì không gửi input nữa.
    let before = state.borrow().sent.len();
    session.on_pointer_move(5, 2);
    assert_eq!(state.borrow().sent.len(), before);

    // ── Bước 9: đóng phiên ─────────────────────────────────────────────
    session.close();
    assert_eq!(recorder.borrow().closed.len(), 1);
}

/// Màn hình từ máy đối tác, dựng thành payload multipart.
fn init_payload(width: i32, height: i32) -> Vec<u8> {
    let init = screen_init_parts(width, height);
    let refs: Vec<&[u8]> = init.iter().map(|p| p.as_slice()).collect();
    encode_multipart(&refs)
}

#[test]
fn lan_direct_route_takes_over_when_partner_shares_the_lan() {
    let state = Rc::new(RefCell::new(MockState::default()));
    let recorder = Rc::new(RefCell::new(Recorder::default()));
    let options = ConnectOptions {
        partner_id: "123456789".into(),
        password: "secret".into(),
        display_name: "DevTools".into(),
        device_identity: "A".repeat(32),
        device_password: "12345678".into(),
        local_screen: (1920, 1080),
        tz_offset_minutes: 420,
        local_ip: "192.168.1.5".into(),
        allow_direct: true,
    };
    let mut session = Session::new(
        Box::new(MockRelay { state: state.clone() }),
        Box::new(ObserverProxy { recorder: recorder.clone() }),
        options,
    )
    .expect("tạo phiên thất bại");

    session.start(0.0).expect("mở phiên thất bại");
    pump(&mut session, &state);
    // Phiên phải yêu cầu daemon mở listener LAN ngay từ đầu.
    assert_eq!(state.borrow().direct_listens, 1);

    // Daemon báo đã mở listener LAN (IP/cổng/khoá).
    state.borrow_mut().pending.push(SessionEvent::DirectReady {
        ip: "192.168.1.5".into(),
        port: 54321,
        key: "abc123XYZ4567".into(),
    });
    pump(&mut session, &state);

    // Trả lời đăng ký (public address = 203.0.113.7).
    push_data(
        &state,
        CHANNEL_COMMAND,
        &system_envelope(b"3:443:00111222333:203.0.113.7::0:ping-list:-1:17/10/2026:relay.example:opaque-token", false),
    );
    pump(&mut session, &state);

    // Lệnh tra cứu phải quảng bá listener LAN: "IPRelay|PortRelay|IPLAN|PortLAN|key".
    let lookup = last_command_text(&state);
    let lookup_fields: Vec<&str> = lookup.split(':').collect();
    assert_eq!(lookup_fields.len(), 17);
    assert_eq!(lookup_fields[16], "203.0.113.7|443|192.168.1.5|54321|abc123XYZ4567");
    let correlation = lookup_correlation(&lookup);

    // Máy đối tác cùng địa chỉ public (cùng NAT) và có direct details.
    let reply = format!(
        "8:1:192.168.1.20:unused:203.0.113.7:54000:5900:5901:TmFtZQ==:55100:unused:198.51.100.2:-1:123:relay.example:x:x:x:x:x:secret:192.168.1.20|5555:{correlation}"
    );
    push_data(&state, CHANNEL_COMMAND, &system_envelope(reply.as_bytes(), false));
    pump(&mut session, &state);

    // Cùng LAN → không đóng listener.
    assert!(!state.borrow().direct_listener_closed);

    // Máy đối tác kết nối thẳng vào listener → phiên gửi login trên kênh direct.
    state.borrow_mut().pending.push(SessionEvent::DirectConnected {
        ip: "192.168.1.20".into(),
    });
    pump(&mut session, &state);

    let sent = state.borrow().sent.clone();
    let direct_login = sent
        .iter()
        .find(|(channel, bytes)| *channel == CHANNEL_DIRECT && bytes.len() > 8)
        .map(|(_, bytes)| bytes[4..].to_vec())
        .expect("phải gửi login trên kênh LAN trực tiếp");
    // Kênh direct không có forward envelope: byte đầu là cờ định dạng.
    assert_eq!(direct_login[0], 0);
    let login = String::from_utf8(direct_login[1..].to_vec()).expect("login phải là ASCII");
    assert!(login.starts_with("login:"));

    // Màn hình khởi tạo đến qua kênh direct → chuyển đường chính sang direct.
    push_direct_data(&state, &init_payload(8, 4));
    pump(&mut session, &state);
    assert_eq!(recorder.borrow().connected, vec![(8, 4)]);
    assert!(session.is_connected());

    // Input phải đi qua kênh direct (không bọc forward envelope).
    let before = state.borrow().sent.len();
    session.on_pointer_move(3, 1);
    session.flush_pointer(1_000.0);
    let sent = state.borrow().sent.clone();
    assert!(sent.len() > before);
    let direct_input = sent
        .iter()
        .rev()
        .find(|(channel, _)| *channel == CHANNEL_DIRECT)
        .map(|(_, bytes)| bytes[4..].to_vec())
        .expect("input phải đi qua kênh LAN trực tiếp");
    assert_eq!(direct_input[0], 0, "byte cờ định dạng");
    assert!(String::from_utf8_lossy(&direct_input[1..]).starts_with("8|||512|||"));

    // Không còn payload nào đi qua relay sau khi chuyển đường.
    let relay_inputs = sent
        .iter()
        .filter(|(channel, bytes)| *channel == CHANNEL_PEER && bytes.len() > 8)
        .filter(|(_, bytes)| {
            matches!(decode_envelope(&bytes[4..]), Ok(Envelope::Forward { payload, .. })
                if payload.starts_with(b"8|||512|||"))
        })
        .count();
    assert_eq!(relay_inputs, 0, "input không được đi qua relay nữa");
}

#[test]
fn lan_direct_login_waits_for_the_lookup_reply() {
    // Máy đối tác có thể kết nối thẳng vào listener TRƯỚC khi ta nhận được
    // kết quả tra cứu → phải chờ biết địa chỉ LAN dự kiến rồi mới gửi login.
    let state = Rc::new(RefCell::new(MockState::default()));
    let recorder = Rc::new(RefCell::new(Recorder::default()));
    let options = ConnectOptions {
        partner_id: "123456789".into(),
        password: "secret".into(),
        display_name: "DevTools".into(),
        device_identity: "A".repeat(32),
        device_password: "12345678".into(),
        local_screen: (1920, 1080),
        local_ip: "192.168.1.5".into(),
        ..Default::default()
    };
    let mut session = Session::new(
        Box::new(MockRelay { state: state.clone() }),
        Box::new(ObserverProxy { recorder: recorder.clone() }),
        options,
    )
    .expect("tạo phiên thất bại");

    session.start(0.0).expect("mở phiên thất bại");
    pump(&mut session, &state);
    state.borrow_mut().pending.push(SessionEvent::DirectReady {
        ip: "192.168.1.5".into(),
        port: 54321,
        key: "abc123XYZ4567".into(),
    });
    pump(&mut session, &state);

    // Đăng ký → gửi lệnh tra cứu.
    push_data(
        &state,
        CHANNEL_COMMAND,
        &system_envelope(b"3:443:00111222333:203.0.113.7::0:ping-list:-1:17/10/2026:relay.example:opaque-token", false),
    );
    pump(&mut session, &state);
    let lookup = last_command_text(&state);
    let correlation = lookup_correlation(&lookup);

    // Máy đối tác kết nối tới listener TRƯỚC khi có kết quả tra cứu.
    state.borrow_mut().pending.push(SessionEvent::DirectConnected {
        ip: "192.168.1.20".into(),
    });
    pump(&mut session, &state);
    let sent = state.borrow().sent.clone();
    assert!(
        !sent.iter().any(|(channel, _)| *channel == CHANNEL_DIRECT),
        "chưa được gửi login khi chưa biết địa chỉ LAN của máy đối tác"
    );

    // Kết quả tra cứu tới → lúc này mới gửi login trên kênh trực tiếp.
    let reply = format!(
        "8:1:192.168.1.20:unused:203.0.113.7:54000:5900:5901:TmFtZQ==:55100:unused:198.51.100.2:-1:123:relay.example:x:x:x:x:x:secret:192.168.1.20|5555:{correlation}"
    );
    push_data(&state, CHANNEL_COMMAND, &system_envelope(reply.as_bytes(), false));
    pump(&mut session, &state);
    let sent = state.borrow().sent.clone();
    let direct_login = sent
        .iter()
        .find(|(channel, bytes)| *channel == CHANNEL_DIRECT && bytes.len() > 8)
        .map(|(_, bytes)| bytes[4..].to_vec())
        .expect("phải gửi login trên kênh LAN trực tiếp");
    assert_eq!(direct_login[0], 0);
    assert!(String::from_utf8_lossy(&direct_login[1..]).starts_with("login:"));
}

#[test]
fn lan_direct_is_skipped_when_partner_is_on_another_network() {
    let state = Rc::new(RefCell::new(MockState::default()));
    let recorder = Rc::new(RefCell::new(Recorder::default()));
    let options = ConnectOptions {
        partner_id: "123456789".into(),
        password: "secret".into(),
        display_name: "DevTools".into(),
        device_identity: "A".repeat(32),
        device_password: "12345678".into(),
        local_ip: "192.168.1.5".into(),
        ..Default::default()
    };
    let mut session = Session::new(
        Box::new(MockRelay { state: state.clone() }),
        Box::new(ObserverProxy { recorder: recorder.clone() }),
        options,
    )
    .expect("tạo phiên thất bại");

    session.start(0.0).expect("mở phiên thất bại");
    pump(&mut session, &state);
    state.borrow_mut().pending.push(SessionEvent::DirectReady {
        ip: "192.168.1.5".into(),
        port: 54321,
        key: "abc123XYZ4567".into(),
    });
    pump(&mut session, &state);
    push_data(
        &state,
        CHANNEL_COMMAND,
        &system_envelope(b"3:443:00111222333:203.0.113.7::0:ping-list:-1:17/10/2026:relay.example:opaque-token", false),
    );
    pump(&mut session, &state);
    let lookup = last_command_text(&state);
    let correlation = lookup_correlation(&lookup);

    // Máy đối tác khác địa chỉ public → chắc chắn không cùng LAN.
    let reply = format!(
        "8:1:192.0.2.9:unused:203.0.113.9:54000:5900:5901:TmFtZQ==:55100:unused:198.51.100.2:-1:123:relay.example:x:x:x:x:x:secret:192.0.2.9|5555:{correlation}"
    );
    push_data(&state, CHANNEL_COMMAND, &system_envelope(reply.as_bytes(), false));
    pump(&mut session, &state);

    // Phải đóng listener LAN (không để lộ cổng).
    assert!(state.borrow().direct_listener_closed);

    // Kết nối trực tiếp đến sau đó bị bỏ qua.
    state.borrow_mut().pending.push(SessionEvent::DirectConnected {
        ip: "192.0.2.9".into(),
    });
    pump(&mut session, &state);
    let sent = state.borrow().sent.clone();
    assert!(!sent.iter().any(|(channel, _)| *channel == CHANNEL_DIRECT));
}

/// Tuỳ chọn `allow_direct = false` → không mở listener LAN, không quảng bá
/// cổng lắng nghe và máy đối tác không thể chiếm đường trực tiếp.
#[test]
fn direct_route_is_skipped_when_the_option_is_disabled() {
    let state = Rc::new(RefCell::new(MockState::default()));
    let recorder = Rc::new(RefCell::new(Recorder::default()));
    let options = ConnectOptions {
        partner_id: "123456789".into(),
        password: "secret".into(),
        display_name: "DevTools".into(),
        device_identity: "A".repeat(32),
        device_password: "12345678".into(),
        local_screen: (1920, 1080),
        tz_offset_minutes: 420,
        local_ip: "192.168.1.5".into(),
        allow_direct: false,
    };
    let mut session = Session::new(
        Box::new(MockRelay { state: state.clone() }),
        Box::new(ObserverProxy { recorder: recorder.clone() }),
        options,
    )
    .expect("tạo phiên thất bại");

    session.start(0.0).expect("mở phiên thất bại");
    pump(&mut session, &state);
    // Không được mở listener LAN.
    assert_eq!(state.borrow().direct_listens, 0);

    // Daemon vẫn có thể báo listener (đã mở từ lần trước) — phiên phải bỏ qua.
    state.borrow_mut().pending.push(SessionEvent::DirectReady {
        ip: "192.168.1.5".into(),
        port: 54321,
        key: "abc123XYZ4567".into(),
    });
    pump(&mut session, &state);

    // Trả lời đăng ký (public address = 203.0.113.7).
    push_data(
        &state,
        CHANNEL_COMMAND,
        &system_envelope(b"3:443:00111222333:203.0.113.7::0:ping-list:-1:17/10/2026:relay.example:opaque-token", false),
    );
    pump(&mut session, &state);

    // Lệnh tra cứu không được quảng bá listener LAN (trường cuối rỗng).
    let lookup = last_command_text(&state);
    let lookup_fields: Vec<&str> = lookup.split(':').collect();
    assert_eq!(lookup_fields.len(), 17);
    assert_eq!(lookup_fields[16], "", "không được quảng bá cổng LAN khi đã tắt direct");
    let correlation = lookup_correlation(&lookup);

    // Máy đối tác cùng địa chỉ public + có direct details — vẫn bị bỏ qua.
    let reply = format!(
        "8:1:192.168.1.20:unused:203.0.113.7:54000:5900:5901:TmFtZQ==:55100:unused:198.51.100.2:-1:123:relay.example:x:x:x:x:x:secret:192.168.1.20|5555:{correlation}"
    );
    push_data(&state, CHANNEL_COMMAND, &system_envelope(reply.as_bytes(), false));
    pump(&mut session, &state);

    // Máy đối tác kết nối thẳng vào listener → bị bỏ qua, không login direct.
    state.borrow_mut().pending.push(SessionEvent::DirectConnected {
        ip: "192.168.1.20".into(),
    });
    pump(&mut session, &state);
    let sent = state.borrow().sent.clone();
    assert!(!sent.iter().any(|(channel, _)| *channel == CHANNEL_DIRECT));
    assert!(!session.is_direct_route());
}

/// Tái hiện lỗi "RefCell already mutably borrowed" của bản cũ.
///
/// Ở tầng glue (wasm), relay gọi lại vào ô chứa session (để gửi message điều
/// khiển) trong lúc ô đó đang được khoá → `RefCell` panic → wasm trap
/// `unreachable` (wasm32 dùng `panic = "abort"`) → phiên chết, log chỉ còn
/// "RuntimeError: unreachable".
///
/// Test này dựng đúng cấu trúc đó: relay mượn lại ô chứa session, còn timer
/// thì LẤY SESSION RA khỏi ô trước khi gọi `tick()` rồi đặt lại — như tầng
/// glue đã sửa. Nếu ai đó để lại khoá ô trong lúc gọi session thì test này
/// panic → bắt được đúng lỗi gốc.
#[test]
fn relay_reentry_does_not_panic_when_the_session_is_taken_out_of_the_state() {
    /// Ô chứa session + relay cùng mượn ô này (mô phỏng `WsRelay` cũ).
    #[derive(Default)]
    struct Shared {
        session: Option<Session>,
        /// Số lần relay gọi lại vào ô này.
        reentries: usize,
    }

    /// Relay mượn lại ô chứa session ở mỗi lệnh điều khiển.
    struct ReentrantRelay {
        shared: Rc<RefCell<Shared>>,
    }

    impl Relay for ReentrantRelay {
        fn open(&mut self, _channel: u8, _host: &str, _port: u16, _cert_host: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
            Ok(())
        }
        fn write(&mut self, _channel: u8, _bytes: &[u8]) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
            Ok(())
        }
        fn close(&mut self, _channel: u8) {
            // Gọi lại vào ô chứa session — đây là chỗ gây panic ở bản cũ.
            let mut shared = self.shared.borrow_mut();
            shared.reentries += 1;
        }
        fn listen_direct(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
            Ok(())
        }
        fn close_direct_listener(&mut self) {
            let mut shared = self.shared.borrow_mut();
            shared.reentries += 1;
        }
    }

    let shared = Rc::new(RefCell::new(Shared::default()));
    let recorder = Rc::new(RefCell::new(Recorder::default()));
    let options = ConnectOptions {
        partner_id: "123456789".into(),
        password: "secret".into(),
        device_identity: "A".repeat(32),
        device_password: "12345678".into(),
        ..Default::default()
    };
    let session = Session::new(
        Box::new(ReentrantRelay { shared: shared.clone() }),
        Box::new(ObserverProxy { recorder: recorder.clone() }),
        options,
    )
    .expect("tạo phiên thất bại");
    // start() đặt deadline (LOGIN_TIMEOUT_MS) để tick() sau đó gọi fail().
    let mut session = session;
    session.start(0.0).expect("mở phiên thất bại");
    shared.borrow_mut().session = Some(session);

    // Timer của tầng glue: lấy session ra khỏi ô, gọi tick(), đặt lại.
    for now in [0.0, 1_000.0, 20_000.0] {
        let taken = shared.borrow_mut().session.take();
        if let Some(mut session) = taken {
            session.tick(now);
            shared.borrow_mut().session = Some(session);
        }
    }

    // tick() sau LOGIN_TIMEOUT_MS sẽ fail() → relay.close() → gọi lại vào ô.
    assert!(shared.borrow().reentries > 0, "phải gọi relay.close() khi hết thời gian chờ");
}

/// Observer dùng chung để test đọc lại được sự kiện.
struct ObserverProxy {
    recorder: Rc<RefCell<Recorder>>,
}
impl SessionObserver for ObserverProxy {
    fn status(&mut self, message: &str) {
        self.recorder.borrow_mut().status.push(message.to_string());
    }
    fn connected(&mut self, width: u32, height: u32) {
        self.recorder.borrow_mut().connected.push((width, height));
    }
    fn view_only(&mut self, view_only: bool) {
        self.recorder.borrow_mut().view_only.push(view_only);
    }
    fn frame(&mut self) {
        self.recorder.borrow_mut().frames += 1;
    }
    fn chat(&mut self, text: &str) {
        self.recorder.borrow_mut().chat.push(text.to_string());
    }
    fn closed(&mut self, message: &str) {
        self.recorder.borrow_mut().closed.push(message.to_string());
    }
}

#[test]
fn switching_monitors_changes_the_visible_region() {
    let state = Rc::new(RefCell::new(MockState::default()));
    let recorder = Rc::new(RefCell::new(Recorder::default()));
    let options = ConnectOptions {
        partner_id: "123456789".into(),
        password: "secret".into(),
        display_name: "DevTools".into(),
        device_identity: "A".repeat(32),
        device_password: "12345678".into(),
        ..Default::default()
    };
    let mut session = Session::new(
        Box::new(MockRelay { state: state.clone() }),
        Box::new(ObserverProxy { recorder: recorder.clone() }),
        options,
    )
    .expect("tạo phiên thất bại");

    session.start(0.0).expect("mở phiên thất bại");
    pump(&mut session, &state);

    // Trả lời đăng ký + tra cứu (như test chính).
    push_data(
        &state,
        CHANNEL_COMMAND,
        &system_envelope(b"3:443:00111222333:203.0.113.7::0:ping-list:-1:17/10/2026:relay.example:opaque-token", false),
    );
    pump(&mut session, &state);
    let lookup = last_command_text(&state);
    let correlation = lookup_correlation(&lookup);
    let reply = format!(
        "8:1:192.0.2.9:unused:203.0.113.9:54000:5900:5901:TmFtZQ==:55100:unused:198.51.100.2:-1:123:relay.example:x:x:x:x:x:secret:direct-info:{correlation}"
    );
    push_data(&state, CHANNEL_COMMAND, &system_envelope(reply.as_bytes(), false));
    pump(&mut session, &state);

    // Gửi màn hình 2 màn hình.
    let init = screen_init_two_monitors();
    let init_refs: Vec<&[u8]> = init.iter().map(|p| p.as_slice()).collect();
    push_data(&state, CHANNEL_PEER, &peer_frame(&encode_multipart(&init_refs)));
    pump(&mut session, &state);

    assert_eq!(session.monitor_count(), 2);
    // Mặc định xem toàn bộ desktop ảo.
    assert_eq!(session.selected_monitor(), 0);
    assert_eq!(session.view_rect().unwrap(), Rect { x: 0, y: 0, width: 3840, height: 1080 });

    // Chọn màn hình thứ 2 → chỉ hiện phần ảnh của màn hình đó.
    assert!(session.set_monitor(2));
    assert_eq!(session.selected_monitor(), 2);
    assert_eq!(session.view_rect().unwrap(), Rect { x: 1920, y: 0, width: 1920, height: 1080 });

    // Quay lại "tất cả" (index 0).
    assert!(session.set_monitor(0));
    assert_eq!(session.view_rect().unwrap(), Rect { x: 0, y: 0, width: 3840, height: 1080 });

    // Chọn lại màn hình đang chọn → không đổi.
    assert!(!session.set_monitor(0));
    // Chọn số màn hình không tồn tại → về "tất cả".
    assert!(session.set_monitor(1));
    assert!(session.set_monitor(9));
    assert_eq!(session.selected_monitor(), 0);
}
