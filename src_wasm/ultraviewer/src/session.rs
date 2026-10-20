//! Phiên xem màn hình máy khác qua relay UltraViewer.
//!
//! Port từ `UltraViewerRelaySession.swift` / `LinuxViewer/src/client.rs`
//! (MacViewer — MIT). Khác biệt: bản gốc chạy bằng thread, bản này là máy
//! trạng thái điều khiển bằng sự kiện để chạy được trong WebAssembly:
//!   `handle(event)` nhận dữ liệu từ relay, `tick(now)` chạy deadline/heartbeat.
//!
//! Luồng:
//!   1. mở kênh lệnh → đăng ký viewer (lệnh "3") → nhận ID được cấp
//!   2. tra cứu máy đối tác (lệnh "8") → nhận địa chỉ relay
//!   3. mở kênh dữ liệu tới relay → gửi "login"
//!   4. nhận màn hình (lệnh 0) → nhận khung hình (lệnh 1) → vẽ lại
//!   5. gửi chuột/bàn phím theo yêu cầu của người dùng

use std::collections::HashMap;

use crate::chat::{self, ChatEvent};
use crate::clipboard;
use crate::cursor::{self, CursorState};
use crate::input;
use crate::messages::{self, LoginContext, PeerInfo, Registration, RegistrationReply};
use crate::screen::{self, Limits, Rect, Renderer, RESET_FRAME_NUMBER};
use crate::transport::{frame_bytes, FrameReader, Relay, SessionEvent, CHANNEL_COMMAND, CHANNEL_PEER};
use crate::wire::{
    decode_envelope, decode_multipart, forward_envelope, random_string, relay_keepalive_envelope, system_envelope,
    CommandCipher, Envelope, Ipv4, Result, MAX_FRAME,
};

/// Host của kênh lệnh (đăng ký + tra cứu).
pub const COMMAND_HOST: &str = "functions3.ultraviewer.net";
pub const COMMAND_PORT: u16 = 443;
/// Relay mặc định khi máy đối tác không trả về hostname.
pub const DEFAULT_RELAY_HOST: &str = "functions3.ultraviewer.net";
/// Thời gian tối đa để đăng ký/tra cứu/nhận màn hình (giống `armDeadline`).
pub const LOGIN_TIMEOUT_MS: f64 = 20_000.0;
/// Chu kỳ heartbeat (giống `sendHeartbeat`).
pub const HEARTBEAT_MS: f64 = 10_000.0;
/// Chất lượng hình ảnh mà máy đối tác dùng để nén (30 = nhanh, 45 = cân bằng,
/// 70 = đẹp). Giống RemoteControlCommands.quality của MacViewer.
pub const DEFAULT_DISPLAY_QUALITY: i32 = 45;

/// Nhịp tối đa gửi vị trí chuột (ms). Máy đối tác phải chụp + nén + gửi lại
/// màn hình cho mỗi lần di chuyển nên gửi dồn sẽ làm con trỏ bị trễ.
pub const POINTER_SEND_INTERVAL_MS: f64 = 40.0;

/// Tuỳ chọn kết nối do tầng UI truyền vào.
#[derive(Clone, Debug)]
pub struct ConnectOptions {
    pub partner_id: String,
    pub password: String,
    /// Tên hiển thị gửi cho máy đối tác (tối đa 20 ký tự, không dấu phân cách).
    pub display_name: String,
    /// Danh tính thiết bị 32 hex (rỗng = sinh ngẫu nhiên mỗi phiên).
    pub device_identity: String,
    /// Mật khẩu thiết bị 8 chữ số (rỗng = sinh ngẫu nhiên).
    pub device_password: String,
    /// Kích thước màn hình "của máy này" gửi kèm lệnh login.
    pub local_screen: (u32, u32),
    /// Lệch giờ so với UTC (phút) gửi kèm lệnh tra cứu.
    pub tz_offset_minutes: i32,
    /// IP nội bộ của máy chạy daemon (do daemon báo).
    pub local_ip: String,
}

impl Default for ConnectOptions {
    fn default() -> Self {
        ConnectOptions {
            partner_id: String::new(),
            password: String::new(),
            display_name: "WebViewer".into(),
            device_identity: String::new(),
            device_password: String::new(),
            local_screen: (1920, 1080),
            tz_offset_minutes: 0,
            local_ip: String::new(),
        }
    }
}

/// Thông báo từ phiên lên tầng UI.
pub trait SessionObserver {
    fn status(&mut self, _message: &str) {}
    fn connected(&mut self, _width: u32, _height: u32) {}
    fn view_only(&mut self, _view_only: bool) {}
    /// Một khung hình mới đã được áp dụng (dùng `take_dirty` để lấy vùng đổi).
    fn frame(&mut self) {}
    fn chat(&mut self, _text: &str) {}
    fn typing(&mut self, _typing: bool) {}
    fn clipboard(&mut self, _text: &str) {}
    fn closed(&mut self, _message: &str) {}
}

#[derive(Clone, Copy, PartialEq, Debug)]
enum Phase {
    Idle,
    /// Đã gửi lệnh đăng ký, chờ trả lời "3:".
    Registering,
    /// Đã gửi lệnh tra cứu, chờ trả lời "8:".
    LookingUp,
    /// Đang mở kênh tới relay của máy đối tác.
    Connecting,
    Closed,
}

/// Phiên xem màn hình.
pub struct Session {
    relay: Box<dyn Relay>,
    observer: Box<dyn SessionObserver>,
    options: ConnectOptions,
    phase: Phase,
    registration: Option<Registration>,
    local_id: String,
    correlation: i32,
    connection_hash: String,
    peer: Option<PeerInfo>,
    peer_ip: Ipv4,
    peer_port: u16,
    screen: Option<Renderer>,
    version: String,
    view_only: bool,
    active: bool,
    accepted: bool,
    refreshes: u32,
    encoder: input::Encoder,
    readers: HashMap<u8, FrameReader>,
    deadline: Option<f64>,
    next_heartbeat: f64,
    heartbeat_ticks: u32,
    clipboard_allowed: bool,
    /// Các lệnh đã nhận từ máy đối tác (chẩn đoán).
    received_commands: Vec<u8>,
    /// Tổng thời gian xử lý khung hình (micro giây), đo ở tầng glue.
    decode_micros: u64,
    /// Số khung hình đã áp dụng.
    frames_applied: u64,
    /// Tổng số byte nén đã nhận.
    payload_bytes: u64,
    /// Các payload đã gửi tới máy đối tác (chẩn đoán).
    sent_payloads: Vec<String>,
    /// Con trỏ của máy đối tác (máy Windows không vẽ con trỏ vào khung hình
    /// mà gửi riêng lệnh 3/4/28 — viewer phải tự vẽ).
    cursor: CursorState,
    /// Gốc toạ độ "bàn phím ảo" của màn hình từ xa.
    origin: (i32, i32),
    /// Các màn hình của máy đối tác (left, top, right, bottom).
    monitors: Vec<[i32; 4]>,
    /// Màn hình đang chọn: 0 = tất cả, 1..n = màn hình thứ n.
    monitor_index: usize,
    /// Công tắc "điều khiển" phía người dùng (máy đối tác vẫn là bên quyết
    /// định cuối cùng qua lệnh 49).
    control_enabled: bool,
    /// Vị trí chuột đang chờ gửi (chỉ giữ vị trí mới nhất).
    ///
    /// Mỗi lần di chuyển chuột, máy đối tác phải chụp lại màn hình + nén +
    /// gửi ảnh. Nếu gửi mọi event (chuột có thể 100+ lần/giây) thì máy đối tác
    /// không kịp xử lý → con trỏ bị trễ và cảm giác "lag". Giống cách
    /// RemoteInputBuffer của MacViewer: gộp các lần di chuyển liên tiếp, chỉ
    /// gửi vị trí mới nhất theo nhịp giới hạn.
    pending_pointer: Option<(i32, i32)>,
    /// Mốc thời gian (ms) gửi vị trí chuột gần nhất.
    last_pointer_sent: f64,
    /// Chất lượng hình ảnh yêu cầu với máy đối tác.
    display_quality: i32,
    closed: bool,
}

impl Session {
    pub fn new(relay: Box<dyn Relay>, observer: Box<dyn SessionObserver>, options: ConnectOptions) -> Result<Self> {
        let id = options.partner_id.trim();
        if id.is_empty() || id.len() > 64 || !id.bytes().all(|b| b.is_ascii_digit()) {
            return Err("Enter the partner's UltraViewer ID and password.".into());
        }
        if options.password.is_empty() {
            return Err("Enter the partner's UltraViewer ID and password.".into());
        }
        if !options.password.is_ascii() {
            return Err("UltraViewer passwords must be ASCII.".into());
        }
        let registration = None;
        let correlation = loop {
            let b = crate::wire::random_bytes(4);
            let n = i32::from_le_bytes([b[0], b[1], b[2], b[3]]) & i32::MAX;
            if n != 0 {
                break n;
            }
        };
        Ok(Session {
            relay,
            observer,
            phase: Phase::Idle,
            registration,
            local_id: String::new(),
            correlation,
            connection_hash: random_string(16, b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"),
            peer: None,
            peer_ip: Ipv4([0, 0, 0, 0]),
            peer_port: 0,
            screen: None,
            version: String::new(),
            view_only: false,
            active: false,
            accepted: false,
            refreshes: 0,
            encoder: input::Encoder::new(false),
            readers: HashMap::new(),
            deadline: None,
            next_heartbeat: 0.0,
            heartbeat_ticks: 0,
            clipboard_allowed: false,
            received_commands: Vec::new(),
            decode_micros: 0,
            frames_applied: 0,
            payload_bytes: 0,
            sent_payloads: Vec::new(),
            cursor: CursorState::default(),
            origin: (0, 0),
            monitors: Vec::new(),
            monitor_index: 0,
            control_enabled: true,
            pending_pointer: None,
            last_pointer_sent: 0.0,
            display_quality: DEFAULT_DISPLAY_QUALITY,
            closed: false,
            options,
        })
    }

    /// Các lệnh đã nhận từ máy đối tác (để chẩn đoán).
    pub fn received_commands(&self) -> &[u8] {
        &self.received_commands
    }

    /// Số khung hình đã áp dụng + tổng thời gian xử lý (ms) + tổng byte nén.
    pub fn frame_stats(&self) -> (u64, u64, u64) {
        (self.frames_applied, self.decode_micros / 1000, self.payload_bytes)
    }

    /// Cộng thêm thời gian đã dùng để xử lý khung hình (micro giây).
    pub fn add_decode_time(&mut self, micros: u64) {
        self.decode_micros += micros;
    }

    /// Các payload đã gửi tới máy đối tác (để chẩn đoán).
    pub fn sent_payloads(&self) -> &[String] {
        &self.sent_payloads
    }

    /// Số màn hình của máy đối tác (0 = chưa có thông tin).
    pub fn monitor_count(&self) -> usize {
        self.monitors.len()
    }

    /// Màn hình đang chọn: 0 = tất cả, 1..n = màn hình thứ n.
    pub fn selected_monitor(&self) -> usize {
        self.monitor_index
    }

    /// Chọn màn hình hiển thị (0 = tất cả). Trả về true nếu có thay đổi.
    pub fn set_monitor(&mut self, index: usize) -> bool {
        let index = if index == 0 || index <= self.monitors.len() { index } else { 0 };
        if index == self.monitor_index {
            return false;
        }
        self.monitor_index = index;
        true
    }

    /// Vùng ảnh đang hiển thị (toạ độ trong ảnh màn hình từ xa).
    /// Chọn 1 màn hình thì chỉ hiện phần ảnh của màn hình đó.
    pub fn view_rect(&self) -> Option<Rect> {
        let (width, height) = self.screen_size();
        if width == 0 || height == 0 {
            return None;
        }
        if self.monitor_index == 0 {
            return Some(Rect { x: 0, y: 0, width, height });
        }
        let monitor = *self.monitors.get(self.monitor_index - 1)?;
        let x = monitor[0] - self.origin.0;
        let y = monitor[1] - self.origin.1;
        let w = (monitor[2] - monitor[0]).max(0);
        let h = (monitor[3] - monitor[1]).max(0);
        if w == 0 || h == 0 || x + w > width as i32 || y + h > height as i32 {
            return None;
        }
        Some(Rect { x, y, width: w as u32, height: h as u32 })
    }

    /// Gốc toạ độ của desktop ảo (virtualLeft/virtualTop hiệu dụng).
    ///
    /// Máy đối tác báo vị trí con trỏ theo toạ độ desktop ảo, nên khi vẽ lên
    /// canvas (ảnh bắt đầu từ gốc này) phải trừ đi gốc này.
    pub fn virtual_origin(&self) -> (i32, i32) {
        self.origin
    }

    /// Lệch của vùng đang hiển thị so với ảnh (dùng cộng vào toạ độ chuột
    /// khi đang xem riêng 1 màn hình — giống `+ region.x` của MacViewer).
    pub fn view_offset(&self) -> (i32, i32) {
        self.view_rect().map(|rect| (rect.x, rect.y)).unwrap_or((0, 0))
    }

    /// Đổi chất lượng hình ảnh (30 = nhanh, 45 = cân bằng, 70 = đẹp).
    pub fn set_display_quality(&mut self, quality: i32) {
        let quality = quality.clamp(0, 100);
        if quality == self.display_quality {
            return;
        }
        self.display_quality = quality;
        if self.active {
            let message = format!("31|||{}", quality);
            self.send_peer(message.as_bytes());
        }
    }

    /// Chất lượng hình ảnh hiện tại.
    pub fn display_quality(&self) -> i32 {
        self.display_quality
    }

    /// Ảnh con trỏ hiện tại của máy đối tác (0xAARRGGBB, top-down) + điểm nóng.
    pub fn cursor_image(&self) -> Option<(usize, usize, usize, usize, Vec<u32>)> {
        self.cursor.image().map(|image| {
            (image.width, image.height, image.hot_x, image.hot_y, image.pixels.clone())
        })
    }

    /// Vị trí con trỏ trên màn hình từ xa (đã trừ gốc toạ độ ảo).
    pub fn cursor_position(&self) -> Option<(i32, i32)> {
        self.cursor.position.map(|(x, y)| (x - self.origin.0, y - self.origin.1))
    }

    pub fn is_connected(&self) -> bool {
        self.active && !self.closed
    }

    /// IP nội bộ của máy chạy daemon (daemon báo qua `open_ok`), dùng làm địa
    /// chỉ máy này trong thông tin đăng ký.
    pub fn set_local_ip(&mut self, ip: &str) {
        if !ip.is_empty() {
            self.options.local_ip = ip.to_string();
        }
    }

    pub fn is_view_only(&self) -> bool {
        self.view_only
    }

    pub fn version(&self) -> &str {
        &self.version
    }

    /// Kích thước màn hình từ xa hiện tại.
    pub fn screen_size(&self) -> (u32, u32) {
        self.screen.as_ref().map(|r| (r.width(), r.height())).unwrap_or((0, 0))
    }

    /// Các vùng màn hình vừa thay đổi (tọa độ trong ảnh màn hình từ xa).
    pub fn take_dirty(&mut self) -> Vec<Rect> {
        let Some(renderer) = self.screen.as_mut() else { return Vec::new() };
        renderer.take_dirty()
    }

    /// Pixel RGBA của một vùng trong ảnh màn hình từ xa.
    pub fn region_pixels(&self, rect: Rect) -> Option<Vec<u8>> {
        let renderer = self.screen.as_ref()?;
        Some(renderer.rect_rgba(rect))
    }

    // ───────────────────────── vòng đời ─────────────────────────

    /// Bắt đầu: mở kênh lệnh tới relay.
    pub fn start(&mut self, now: f64) -> Result<()> {
        self.phase = Phase::Registering;
        self.deadline = Some(now + LOGIN_TIMEOUT_MS);
        self.observer.status("Registering this computer…");
        self.relay.open(CHANNEL_COMMAND, COMMAND_HOST, COMMAND_PORT, COMMAND_HOST)
    }

    /// Xử lý một sự kiện từ tầng truyền tải.
    pub fn handle(&mut self, event: SessionEvent, now: f64) {
        if self.closed {
            return;
        }
        match event {
            SessionEvent::Opened { channel } => self.on_opened(channel, now),
            SessionEvent::OpenFailed { channel, message } => {
                if channel == CHANNEL_COMMAND {
                    self.fail(&message);
                }
            }
            SessionEvent::Closed { channel: _, message } => {
                self.fail(&message);
            }
            SessionEvent::Data { channel, bytes } => self.on_data(channel, &bytes, now),
        }
    }

    /// Kiểm tra deadline + heartbeat (gọi định kỳ).
    pub fn tick(&mut self, now: f64) {
        if self.closed {
            return;
        }
        if let Some(deadline) = self.deadline {
            if !self.active && now >= deadline {
                self.fail("The partner did not accept the session in time.");
                return;
            }
            if self.active {
                self.deadline = None;
            }
        }
        if self.active && now >= self.next_heartbeat {
            self.next_heartbeat = now + HEARTBEAT_MS;
            self.send_heartbeat();
        }
    }

    /// Ngắt phiên (báo cho máy đối tác trước khi đóng).
    pub fn close(&mut self) {
        if self.closed {
            return;
        }
        if self.active {
            let _ = self.send_peer(b"19");
        }
        self.closed = true;
        self.phase = Phase::Closed;
        self.relay.close(CHANNEL_PEER);
        self.relay.close(CHANNEL_COMMAND);
        self.observer.closed("Disconnected.");
    }

    fn fail(&mut self, message: &str) {
        if self.closed {
            return;
        }
        self.closed = true;
        self.phase = Phase::Closed;
        self.relay.close(CHANNEL_PEER);
        self.relay.close(CHANNEL_COMMAND);
        self.observer.closed(message);
    }

    // ───────────────────────── kênh ─────────────────────────

    fn on_opened(&mut self, channel: u8, now: f64) {
        match channel {
            CHANNEL_COMMAND => {
                self.readers.insert(channel, FrameReader::new());
                // Thông tin đăng ký chỉ dựng được sau khi biết IP nội bộ.
                match build_registration(&self.options) {
                    Ok(registration) => self.registration = Some(registration),
                    Err(e) => {
                        self.fail(&format!("Could not build the registration: {e}"));
                        return;
                    }
                }
                self.write(channel, &http_preamble(COMMAND_HOST));
                self.send_registration();
                self.deadline = Some(now + LOGIN_TIMEOUT_MS);
            }
            CHANNEL_PEER => {
                self.readers.insert(channel, FrameReader::new());
                let host = self
                    .peer
                    .as_ref()
                    .map(|p| p.relay_hostname.clone())
                    .filter(|h| !h.is_empty())
                    .unwrap_or_else(|| DEFAULT_RELAY_HOST.to_string());
                self.write(channel, &http_preamble(&host));
                self.send_login(0, false);
                self.deadline = Some(now + LOGIN_TIMEOUT_MS);
            }
            _ => {}
        }
    }

    fn write(&mut self, channel: u8, bytes: &[u8]) {
        if let Err(e) = self.relay.write(channel, bytes) {
            self.fail(&format!("The UltraViewer connection failed: {e}"));
        }
    }

    /// Gửi một frame length-prefixed xuống relay.
    fn send_frame(&mut self, channel: u8, payload: &[u8]) {
        if payload.len() > MAX_FRAME {
            self.fail("The UltraViewer message is too large.");
            return;
        }
        self.write(channel, &frame_bytes(payload));
    }

    fn on_data(&mut self, channel: u8, bytes: &[u8], now: f64) {
        let reader = self.readers.entry(channel).or_insert_with(FrameReader::new);
        let frames = match reader.push(bytes) {
            Ok(f) => f,
            Err(e) => {
                self.fail(&format!("The UltraViewer connection failed: {e}"));
                return;
            }
        };
        for frame in frames {
            match channel {
                CHANNEL_COMMAND => self.on_command_frame(&frame, now),
                CHANNEL_PEER => self.on_peer_frame(&frame),
                _ => {}
            }
        }
    }

    // ───────────────────────── kênh lệnh ─────────────────────────

    fn send_registration(&mut self) {
        let Some(registration) = self.registration.as_ref() else { return };
        let text = match registration.text() {
            Ok(t) => t,
            Err(e) => {
                self.fail(&format!("Could not build the registration: {e}"));
                return;
            }
        };
        self.send_encrypted_command(text.as_bytes());
    }

    /// Lệnh tới daemon (đăng ký / tra cứu / keepalive) luôn được mã hoá
    /// bằng cipher của server rồi bọc trong system envelope `01 00`.
    fn send_encrypted_command(&mut self, plaintext: &[u8]) {
        let ct = CommandCipher::server().encrypt(plaintext);
        self.send_frame(CHANNEL_COMMAND, &system_envelope(&ct, true));
    }

    fn on_command_frame(&mut self, frame: &[u8], now: f64) {
        let payload = match decode_envelope(frame) {
            Ok(Envelope::System(p)) => p.to_vec(),
            // Forward envelope trên kênh lệnh không phải phản hồi của ta.
            Ok(Envelope::Forward { .. }) => return,
            Err(e) => {
                self.fail(&format!("The UltraViewer service sent an invalid message: {e}"));
                return;
            }
        };
        if self.phase == Phase::Registering && payload.starts_with(b"3:") {
            let reply = match messages::parse_registration_reply(&payload) {
                Ok(r) => r,
                Err(e) => {
                    self.fail(&format!("UltraViewer sent an invalid registration reply: {e}"));
                    return;
                }
            };
            self.local_id = reply.id.clone();
            self.phase = Phase::LookingUp;
            self.deadline = Some(now + LOGIN_TIMEOUT_MS);
            self.observer.status("Finding the partner computer…");
            self.send_lookup(&reply);
            return;
        }
        if self.phase == Phase::LookingUp && payload.starts_with(b"8:") {
            let reply = match messages::parse_lookup_reply(&payload) {
                Ok(r) => r,
                Err(e) => {
                    self.fail(&format!("UltraViewer sent an invalid lookup reply: {e}"));
                    return;
                }
            };
            if reply.correlation != Some(self.correlation) {
                return;
            }
            match (reply.status, reply.peer) {
                (2, _) => {
                    self.fail("UltraViewer rejected the partner password.");
                }
                (1, Some(peer)) => self.start_peer(peer, now),
                (status, _) => self.fail(&lookup_status_text(status)),
            }
        }
    }

    fn send_lookup(&mut self, _registration: &RegistrationReply) {
        let Some(registration) = self.registration.as_ref() else { return };
        let text = match messages::lookup_fields(&messages::LookupRequest {
            target_id: self.options.partner_id.trim(),
            password: &self.options.password,
            license: "",
            license2: "",
            local_id: &self.local_id,
            local_password: &registration.password,
            correlation: self.correlation,
            referral: "0",
            payment: "0",
            tz_offset_minutes: self.options.tz_offset_minutes,
            dictionary_count: 1,
            // Không dùng kênh trực tiếp trong LAN: trình duyệt không mở được
            // socket lắng nghe, nên phần chi tiết để trống.
            direct_details: "",
        }) {
            Ok(t) => t,
            Err(e) => {
                self.fail(&format!("Could not build the partner lookup: {e}"));
                return;
            }
        };
        self.send_encrypted_command(text.as_bytes());
    }

    fn start_peer(&mut self, peer: PeerInfo, now: f64) {
        self.peer_ip = peer.public_ip;
        self.peer_port = peer.target_port;
        self.phase = Phase::Connecting;
        self.deadline = Some(now + LOGIN_TIMEOUT_MS);
        self.observer.status("Connecting to the partner computer…");
        // Relay được giao trả về địa chỉ IP nhưng chứng thư TLS lại theo tên
        // miền (*.ultraviewer.net) — phải dùng hostname để kiểm tra chứng thư,
        // không dùng IP (chứng thư không có IP SAN).
        let host = if peer.relay_hostname.is_empty() {
            DEFAULT_RELAY_HOST.to_string()
        } else {
            peer.relay_hostname.clone()
        };
        let relay_ip = peer.relay_ip.clone();
        self.peer = Some(peer);
        if let Err(e) = self.relay.open(CHANNEL_PEER, &relay_ip, COMMAND_PORT, &host) {
            self.fail(&format!("Could not reach the UltraViewer relay: {e}"));
        }
    }

    // ───────────────────────── kênh dữ liệu ─────────────────────────

    fn on_peer_frame(&mut self, frame: &[u8]) {
        let (ip, port, payload) = match decode_envelope(frame) {
            // "pong" và các system message khác không mang dữ liệu màn hình.
            Ok(Envelope::System(_)) => return,
            Ok(Envelope::Forward { ip, port, payload }) => (ip, port, payload),
            Err(e) => {
                self.fail(&format!("The partner sent an invalid message: {e}"));
                return;
            }
        };
        let known = ip == self.peer_ip && port == self.peer_port;
        let parts = match decode_multipart(payload) {
            Ok(p) => p,
            Err(e) => {
                if known {
                    self.fail(&format!("The partner sent an invalid message: {e}"));
                }
                return;
            }
        };
        let Some(&command) = parts.first().and_then(|p| p.first()) else {
            if known {
                self.fail("The partner returned incomplete screen information.");
            }
            return;
        };
        // Lệnh 26 là "đổi relay" và luôn được chấp nhận (không theo địa chỉ cũ).
        let relay_switch = command == 26 && parts.get(1) == Some(&self.connection_hash.as_bytes());
        if !known && !relay_switch {
            return;
        }
        self.consume_app(&parts);
    }

    fn consume_app(&mut self, parts: &[&[u8]]) {
        let Some(&command) = parts.first().and_then(|p| p.first()) else {
            self.fail("The partner returned incomplete screen information.");
            return;
        };
        if self.received_commands.len() < 256 {
            self.received_commands.push(command);
        }
        let active = self.active;
        match command {
            0 => self.initialize(parts),
            1 if active => self.frame(parts),
            48 if active => {
                if let Some(renderer) = self.screen.as_mut() {
                    let _ = renderer.set_tile_size(parts);
                }
            }
            3 | 4 | 28 if active => {
                // Con trỏ: máy đối tác gửi lệnh chọn hình (3), hình mới (4) và
                // vị trí (28). Khi thiếu hình phải yêu cầu host gửi (4|||hash).
                if let Some(message) = cursor::parse(parts) {
                    if let Some(request) = self.cursor.apply(message) {
                        self.send_peer(&request);
                    }
                }
            }
            23 if active => {
                self.active = false;
                self.send_login(-1, false);
            }
            26 => {
                if parts.get(1) != Some(&self.connection_hash.as_bytes()) {
                    return;
                }
                if let Ok(Envelope::Forward { ip, port, .. }) = decode_envelope(&[]) {
                    let _ = (ip, port);
                }
                if active {
                    self.active = false;
                    self.screen = None;
                    self.send_login(-1, true);
                }
            }
            27 | 41 | 54 => self.fail("The remote computer disconnected."),
            39 => self.fail("The remote computer blocked this connection."),
            12 | 29 | 30 if active => {
                if let Ok(Some(event)) = chat::decode_viewer_parts(parts) {
                    match event {
                        ChatEvent::Message(text) => self.observer.chat(&text),
                        ChatEvent::Typing(typing) => self.observer.typing(typing),
                    }
                }
            }
            5 | 33 if active && self.clipboard_allowed => {
                if let Ok(text) = clipboard::decode_host_to_viewer(parts) {
                    self.observer.clipboard(&text);
                }
            }
            49 => {
                let value = parts.get(1).and_then(|p| p.first()).copied().unwrap_or(0);
                self.view_only = value != 0;
                if active {
                    self.observer.view_only(self.view_only);
                }
            }
            _ => {}
        }
    }

    fn initialize(&mut self, parts: &[&[u8]]) {
        let init = match screen::parse_init(parts) {
            Ok(i) => i,
            Err(e) => {
                self.fail(&format!("The partner returned incomplete screen information: {e}"));
                return;
            }
        };
        let version = init.version();
        if !messages::version_at_least(&version, [6, 0, 0]) {
            self.fail(&format!("This UltraViewer version ({version}) is not supported yet."));
            return;
        }
        let changed = self
            .screen
            .as_ref()
            .map(|r| r.width() != init.width || r.height() != init.height)
            .unwrap_or(true);
        if changed && parts.len() > 13 && parts[13].is_empty() {
            self.fail("The partner returned incomplete screen information.");
            return;
        }
        match self.screen.as_mut() {
            Some(renderer) if !changed => {
                let _ = renderer.set_tile_size(&[&[48u8][..], &[init.tile_size][..]]);
            }
            _ => {
                // Máy đối tác yêu cầu khung hình N+1 sau N, kể cả khi đổi kích thước.
                let last = self.screen.as_ref().map_or(RESET_FRAME_NUMBER, |r| r.last_frame_number());
                match Renderer::with_options(&init, last, 2, Limits::default()) {
                    Ok(renderer) => self.screen = Some(renderer),
                    Err(e) => {
                        self.fail(&format!("The remote screen could not be prepared: {e}"));
                        return;
                    }
                }
            }
        }
        self.version = version;
        // Gốc hiệu dụng = gốc khai báo và cạnh trái trên của mọi màn hình
        // (RemoteControlCommands.effectiveVirtualOrigin).
        self.origin = init.origin();
        self.monitors = init.monitors();
        self.monitor_index = 0;
        self.cursor.reset();
        self.active = true;
        self.deadline = None;
        self.encoder = input::Encoder::new(input::supports_binary_keyboard(&self.version));
        let (width, height) = self.screen_size();
        self.observer.connected(width, height);
        self.observer.view_only(self.view_only);
        // TCP ConnectionType1: viewer trả lời bằng ASCII "17".
        self.send_peer(b"17");
        // Chế độ chuyển đổi 16bpp + chất lượng nén: giống
        // RemoteControlCommands.rgb555ColorMode / .quality của MacViewer.
        // Giảm băng thông và giảm tải CPU cho máy đối tác khi gửi màn hình.
        self.send_peer(b"32|||2");
        let quality = format!("31|||{}", self.display_quality);
        self.send_peer(quality.as_bytes());
        if !self.accepted {
            self.accepted = true;
            // Bật báo vị trí con trỏ (RemoteControlCommands.cursorPositions).
            self.send_peer(b"28|||1");
        }
    }

    fn frame(&mut self, parts: &[&[u8]]) {
        self.payload_bytes += parts.get(2).map(|p| p.len() as u64).unwrap_or(0);
        let applied = match self.screen.as_mut() {
            Some(renderer) => renderer.apply(parts),
            None => return,
        };
        self.frames_applied += 1;
        // Backpressure: chỉ báo "đã xử lý" sau khi giải mã xong để máy đối tác
        // không dồn frame cũ vào hàng đợi.
        self.send_peer(b"18");
        match applied {
            Ok(()) => self.observer.frame(),
            Err(e) => {
                // Cache hỏng thì phải xin lại toàn bộ màn hình.
                if self.refreshes >= 2 {
                    self.fail(&format!("The remote screen could not be decoded: {e}"));
                    return;
                }
                self.refreshes += 1;
                self.active = false;
                self.screen = None;
                self.observer.status("Refreshing the remote screen…");
                self.send_login(-1, true);
            }
        }
    }

    // ───────────────────────── gửi dữ liệu ─────────────────────────

    /// Gửi payload tới máy đối tác qua relay.
    fn send_peer(&mut self, payload: &[u8]) {
        if self.peer_port == 0 {
            return;
        }
        if self.sent_payloads.len() < 64 {
            let text = String::from_utf8_lossy(payload);
            let preview: String = text.chars().take(40).collect();
            self.sent_payloads.push(format!("{} ({} byte)", preview, payload.len()));
        }
        let envelope = forward_envelope(self.peer_ip, self.peer_port, false, payload);
        self.send_frame(CHANNEL_PEER, &envelope);
    }

    fn send_login(&mut self, control_mode: i32, clear_control_mode: bool) {
        let Some(peer) = self.peer.clone() else { return };
        let nonce = random_string(8, b"0123456789");
        let display = self.login_display_name();
        let (w, h) = self.options.local_screen;
        let text = match messages::login_text(&self.options.password, &nonce, &LoginContext {
            screen_width: w,
            screen_height: h,
            local_id: &self.local_id,
            display_name: &display,
            control_mode,
            clear_control_mode,
            connection_hash: &self.connection_hash,
            partner_secret_token: &peer.secret_token,
        }) {
            Ok(t) => t,
            Err(e) => {
                self.fail(&format!("Could not build the login message: {e}"));
                return;
            }
        };
        self.send_peer(text.as_bytes());
    }

    /// Tên gửi cho máy đối tác: ASCII, bỏ ký tự phân cách, tối đa 20 ký tự.
    fn login_display_name(&self) -> String {
        let name: String = self
            .options
            .display_name
            .chars()
            .filter(|ch| !"!#$&?:/\\*,.@<>;'\"=".contains(*ch))
            .take(20)
            .collect();
        if name.is_empty() {
            "WebViewer".into()
        } else {
            name
        }
    }

    fn send_heartbeat(&mut self) {
        self.heartbeat_ticks += 1;
        // Keepalive của relay: system envelope "ping" (không mã hoá).
        self.send_frame(CHANNEL_PEER, &relay_keepalive_envelope());
        self.send_peer(b"20");
        if self.heartbeat_ticks % 6 == 0 {
            // frmMain.tmPingServer: ASCII "2" đã mã hoá, chu kỳ 60 giây.
            let ct = CommandCipher::server().encrypt(b"2");
            self.send_frame(CHANNEL_COMMAND, &system_envelope(&ct, true));
        }
    }

    // ───────────────────────── nhập liệu từ người dùng ─────────────────────────

    /// Chuột di chuyển (toạ độ pixel trên màn hình từ xa).
    ///
    /// Chỉ lưu vị trí mới nhất; `flush_pointer` sẽ gửi theo nhịp giới hạn để
    /// không làm quá tải máy đối tác.
    pub fn on_pointer_move(&mut self, x: i32, y: i32) {
        if !self.can_send_input() {
            return;
        }
        // Chỉ lưu lại; timer của tầng glue sẽ gửi theo nhịp giới hạn.
        self.pending_pointer = Some((x, y));
    }

    /// Gửi vị trí chuột đang chờ nếu đã đủ khoảng cách giữa 2 lần gửi.
    pub fn flush_pointer(&mut self, now: f64) {
        let Some((x, y)) = self.pending_pointer.take() else { return };
        if now - self.last_pointer_sent < POINTER_SEND_INTERVAL_MS {
            // Chưa đủ nhịp → giữ lại, lần sau gửi.
            self.pending_pointer = Some((x, y));
            return;
        }
        self.last_pointer_sent = now;
        for payload in self.encoder.pointer_moved(x, y) {
            self.send_peer(&payload);
        }
    }

    /// Gửi ngay vị trí chuột đang chờ (dùng trước khi gửi nút/phím để giữ
    /// đúng thứ tự sự kiện).
    fn flush_pointer_now(&mut self) {
        let Some((x, y)) = self.pending_pointer.take() else { return };
        self.last_pointer_sent = self.last_pointer_sent.max(0.0);
        for payload in self.encoder.pointer_moved(x, y) {
            self.send_peer(&payload);
        }
    }

    /// Nhấn/thả chuột (0 = trái, 1 = phải, 2 = giữa).
    pub fn on_pointer_button(&mut self, button: u8, pressed: bool, x: i32, y: i32) {
        if !self.can_send_input() {
            return;
        }
        // Gửi vị trí đang chờ trước để thứ tự sự kiện trên máy đối tác đúng.
        self.flush_pointer_now();
        for payload in self.encoder.pointer_button(button, pressed, Some((x, y))) {
            self.send_peer(&payload);
        }
    }

    /// Lăn chuột (1 đơn vị = 1 bước 120, dương = lên).
    pub fn on_wheel(&mut self, lines: f64) {
        if !self.can_send_input() {
            return;
        }
        self.flush_pointer_now();
        for payload in self.encoder.scroll(lines) {
            self.send_peer(&payload);
        }
    }

    /// Phím vật lý (dùng `KeyboardEvent.code`).
    pub fn on_key(&mut self, code: &str, pressed: bool, text: Option<&str>) {
        if !self.can_send_input() {
            return;
        }
        self.flush_pointer_now();
        let code = match static_code(code) {
            Some(c) => c,
            None => return,
        };
        for payload in self.encoder.key(code, pressed, text) {
            self.send_peer(&payload);
        }
    }

    /// Trạng thái phím bổ trợ (shift/ctrl/alt/meta/caps).
    pub fn on_modifiers(&mut self, shift: bool, ctrl: bool, alt: bool, meta: bool, caps: bool) {
        if !self.can_send_input() {
            return;
        }
        let mut flags = 0u8;
        if shift {
            flags |= input::SHIFT;
        }
        if ctrl {
            flags |= input::CONTROL;
        }
        if alt {
            flags |= input::ALT;
        }
        if meta {
            flags |= input::SUPER;
        }
        if caps {
            flags |= input::CAPS_LOCK;
        }
        for payload in self.encoder.modifiers(flags) {
            self.send_peer(&payload);
        }
    }

    /// Nhả toàn bộ phím đang giữ (mất focus, tắt điều khiển...).
    pub fn release_input(&mut self) {
        if !self.active {
            return;
        }
        for payload in self.encoder.release_all() {
            self.send_peer(&payload);
        }
    }

    /// Gửi chat tới máy đối tác.
    pub fn send_chat(&mut self, text: &str) -> Result<()> {
        if !self.active {
            return Err("The remote session is not connected.".into());
        }
        let out = chat::viewer_to_host(text)?;
        let envelope = forward_envelope(self.peer_ip, self.peer_port, out.format_flag, &out.payload);
        self.send_frame(CHANNEL_PEER, &envelope);
        Ok(())
    }

    /// Bật/tắt đồng bộ clipboard.
    pub fn set_clipboard_sharing(&mut self, enabled: bool) {
        self.clipboard_allowed = enabled;
    }

    /// Gửi nội dung clipboard của máy này tới máy đối tác.
    pub fn send_clipboard(&mut self, text: &str) -> Result<()> {
        if !self.active {
            return Err("The remote session is not connected.".into());
        }
        let out = clipboard::viewer_to_host(text)?;
        let envelope = forward_envelope(self.peer_ip, self.peer_port, out.format_flag, &out.payload);
        self.send_frame(CHANNEL_PEER, &envelope);
        Ok(())
    }

    fn can_send_input(&self) -> bool {
        self.active && !self.closed && !self.view_only && self.control_enabled
    }

    /// Bật/tắt gửi chuột & bàn phím tới máy đối tác (công tắc phía người dùng).
    pub fn set_control_enabled(&mut self, enabled: bool) {
        self.control_enabled = enabled;
        if !enabled {
            // Nhả phím đang giữ để máy đối tác không bị "dính" phím.
            let payloads = self.encoder.release_all();
            for payload in payloads {
                self.send_peer(&payload);
            }
        }
    }

    pub fn is_control_enabled(&self) -> bool {
        self.control_enabled
    }
}

/// Tên phím hợp lệ (dùng để kiểm tra nhanh trước khi gửi).
fn static_code(code: &str) -> Option<&'static str> {
    const CODES: [&str; 114] = [
        "KeyA", "KeyB", "KeyC", "KeyD", "KeyE", "KeyF", "KeyG", "KeyH", "KeyI", "KeyJ", "KeyK", "KeyL", "KeyM",
        "KeyN", "KeyO", "KeyP", "KeyQ", "KeyR", "KeyS", "KeyT", "KeyU", "KeyV", "KeyW", "KeyX", "KeyY", "KeyZ",
        "Digit0", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9",
        "Minus", "Equal", "BracketLeft", "BracketRight", "Backslash", "Semicolon", "Quote", "Backquote", "Comma",
        "Period", "Slash", "IntlBackslash", "Space", "Enter", "Tab", "Backspace", "Escape", "ShiftLeft", "ShiftRight",
        "ControlLeft", "ControlRight", "AltLeft", "AltRight", "SuperLeft", "SuperRight", "ContextMenu", "CapsLock",
        "NumLock", "ScrollLock", "PrintScreen", "Pause", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10",
        "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "Insert", "Delete", "Home", "End",
        "PageUp", "PageDown", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Numpad0", "Numpad1", "Numpad2",
        "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9", "NumpadDecimal",
        "NumpadMultiply", "NumpadAdd", "NumpadSubtract", "NumpadDivide", "NumpadEnter", "NumpadEqual",
    ];
    CODES.iter().find(|c| **c == code).copied()
}

fn lookup_status_text(status: i32) -> String {
    match status {
        0 => "The partner ID is not online.".into(),
        _ => format!("UltraViewer declined the partner lookup (code {status})."),
    }
}

/// HTTP preamble gửi ngay sau khi bắt tay TLS (xem `RelayHTTPPreamble.swift`).
fn http_preamble(host: &str) -> Vec<u8> {
    [
        "POST /UVService/ HTTP/1.1",
        "User-Agent: Mozilla/4.0 (compatible; MSIE5.01; Windows NT)",
        "Content-Type: application/octet-stream",
        "Connection: Keep-Alive",
        "Content-length: 8589934590",
        &format!("Host: {host}"),
        "",
        "",
    ]
    .join("\r\n")
    .into_bytes()
}

/// Dựng thông tin đăng ký viewer (28 trường, xem `ClientRegistration.swift`).
fn build_registration(options: &ConnectOptions) -> Result<Registration> {
    let identity = if options.device_identity.len() == 32
        && options.device_identity.bytes().all(|b| b.is_ascii_hexdigit())
    {
        options.device_identity.to_uppercase()
    } else {
        // MD5 của 16 byte ngẫu nhiên → 32 hex.
        let mut seed = [0u8; 16];
        seed.copy_from_slice(&crate::wire::random_bytes(16));
        use md5::{Digest, Md5};
        crate::wire::hex(&Md5::digest(seed)).to_uppercase()
    };
    let password = if options.device_password.len() == 8
        && options.device_password.bytes().all(|b| b.is_ascii_digit())
    {
        options.device_password.clone()
    } else {
        random_string(8, b"0123456789")
    };
    let computer_name = if options.display_name.trim().is_empty() {
        "WebViewer".to_string()
    } else {
        options.display_name.trim().to_string()
    };
    let mut mac = format!("{:0<12}", &identity[..identity.len().min(12)]);
    let first = (u8::from_str_radix(&mac[..2], 16).unwrap_or(0) & 0xfc) | 0x02;
    mac.replace_range(..2, &format!("{first:02X}"));
    let registration = Registration {
        device_identity: identity,
        password,
        local_address: if options.local_ip.is_empty() { "0.0.0.0".into() } else { options.local_ip.clone() },
        computer_name_b64: base64_encode(computer_name.as_bytes()),
        mac_address: mac,
        operating_system: "0|6|0|0|0|0".into(),
        user_name: base64_encode(options.display_name.as_bytes()),
        custom_password: String::new(),
    };
    registration.text()?;
    Ok(registration)
}

/// base64 chuẩn (không dùng crate base64 để giữ module tự chứa).
fn base64_encode(data: &[u8]) -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = *chunk.get(1).unwrap_or(&0) as u32;
        let b2 = *chunk.get(2).unwrap_or(&0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(ALPHABET[(n >> 18) as usize & 63] as char);
        out.push(ALPHABET[(n >> 12) as usize & 63] as char);
        out.push(if chunk.len() > 1 { ALPHABET[(n >> 6) as usize & 63] as char } else { '=' });
        out.push(if chunk.len() > 2 { ALPHABET[n as usize & 63] as char } else { '=' });
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base64_matches_reference() {
        assert_eq!(base64_encode(b"host"), "aG9zdA==");
        assert_eq!(base64_encode(b"a"), "YQ==");
        assert_eq!(base64_encode(b"ab"), "YWI=");
        assert_eq!(base64_encode(b"abc"), "YWJj");
    }

    #[test]
    fn static_code_accepts_known_keys_only() {
        assert_eq!(static_code("KeyA"), Some("KeyA"));
        assert_eq!(static_code("NumpadEnter"), Some("NumpadEnter"));
        assert_eq!(static_code("KeyZzz"), None);
    }

    #[test]
    fn registration_has_28_fields() {
        let options = ConnectOptions {
            device_identity: "A".repeat(32),
            device_password: "12345678".into(),
            display_name: "Web".into(),
            ..Default::default()
        };
        let registration = build_registration(&options).unwrap();
        let text = registration.text().unwrap();
        assert_eq!(text.split(':').count(), 28);
        assert!(text.starts_with("3:AAAAAAAA"));
    }
}
