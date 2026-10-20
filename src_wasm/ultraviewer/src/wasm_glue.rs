//! Lớp nối giữa WebAssembly và trình duyệt.
//!
//! - `Relay` được cài bằng WebSocket tới daemon (Go): daemon mở TCP + TLS tới
//!   relay UltraViewer rồi chuyển byte hai chiều.
//! - Khung hình được vẽ thẳng lên `<canvas>` bằng `putImageData` (chỉ vẽ lại
//!   vùng vừa thay đổi).
//!
//! Giao thức với daemon:
//!   - text (JSON): `{"t":"open","c":1,"host":"...","port":443,"sni":"ultraviewer","cert":"..."}`
//!     → `{"t":"open_ok","c":1,"ip":"192.168.1.5"}` / `{"t":"open_err","c":1,"m":"..."}`
//!     → `{"t":"closed","c":1,"m":"..."}`
//!   - binary: byte đầu là số kênh, phần còn lại là byte thô đi/đến relay.

use std::cell::RefCell;
use std::rc::Rc;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::session::{ConnectOptions, Session, SessionObserver};
use crate::transport::{Relay, SessionEvent, CHANNEL_COMMAND, CHANNEL_DIRECT};

/// Sự kiện phiên gửi lên tầng JS.
enum OutEvent {
    Status(String),
    Connected(u32, u32),
    ViewOnly(bool),
    /// Một khung hình mới đã giải mã xong (sẽ vẽ lên canvas).
    Frame,
    Chat(String),
    Typing(bool),
    Clipboard(String),
    Closed(String),
}

/// Observer tích luỹ sự kiện, không gọi JS trong lúc đang giữ khoá.
#[derive(Default)]
struct Observer {
    events: Vec<OutEvent>,
}

/// Observer dùng chung giữa `Session` và tầng glue.
#[derive(Clone, Default)]
struct SharedObserver {
    inner: Rc<RefCell<Observer>>,
}

impl SharedObserver {
    fn push(&self, event: OutEvent) {
        self.inner.borrow_mut().events.push(event);
    }
}

impl SessionObserver for SharedObserver {
    fn status(&mut self, message: &str) {
        self.push(OutEvent::Status(message.to_string()));
    }
    fn connected(&mut self, width: u32, height: u32) {
        self.push(OutEvent::Connected(width, height));
    }
    fn view_only(&mut self, view_only: bool) {
        self.push(OutEvent::ViewOnly(view_only));
    }
    fn frame(&mut self) {
        self.push(OutEvent::Frame);
    }
    fn chat(&mut self, text: &str) {
        self.push(OutEvent::Chat(text.to_string()));
    }
    fn typing(&mut self, typing: bool) {
        self.push(OutEvent::Typing(typing));
    }
    fn clipboard(&mut self, text: &str) {
        self.push(OutEvent::Clipboard(text.to_string()));
    }
    fn closed(&mut self, message: &str) {
        self.push(OutEvent::Closed(message.to_string()));
    }
}

/// Callback JS do tầng UI đăng ký.
#[derive(Clone, Default)]
struct Callbacks {
    status: Option<js_sys::Function>,
    connected: Option<js_sys::Function>,
    view_only: Option<js_sys::Function>,
    chat: Option<js_sys::Function>,
    typing: Option<js_sys::Function>,
    clipboard: Option<js_sys::Function>,
    closed: Option<js_sys::Function>,
}

/// Kênh điều khiển tới daemon: WebSocket + hàng đợi message chờ gửi.
///
/// **Phải nằm ở `RefCell` riêng, không gộp vào [`State`]**: relay (phía
/// session) gọi lại vào đây mỗi khi cần gửi message điều khiển (mở/đóng
/// kênh, đóng listener LAN). Nếu dùng chung một `RefCell` với `State` thì
/// lệnh gửi sẽ `borrow_mut()` lại trong lúc `State` đang được khoá →
/// `RefCell` panic "already mutably borrowed" → wasm trap `unreachable`
/// (wasm32-unknown-unknown dùng `panic = "abort"`) → phiên chết ngay, log
/// chỉ còn dòng "RuntimeError: unreachable" không có thông báo.
struct Control {
    /// Socket đang mở (None = đã ngắt).
    ws: Option<web_sys::WebSocket>,
    /// WebSocket đã mở xong chưa (mới tạo thì đang CONNECTING).
    open: bool,
    /// Message điều khiển chờ gửi tới daemon (gửi được sau khi socket mở).
    pending: Vec<String>,
}

struct State {
    /// Số khung hình đã giải mã thành công.
    frame_count: u64,
    queue: Vec<SessionEvent>,
    session: Option<Session>,
    observer: SharedObserver,
    canvas: Option<web_sys::HtmlCanvasElement>,
    ctx: Option<web_sys::CanvasRenderingContext2d>,
    /// Canvas phủ lên trên để vẽ con trỏ của máy đối tác (máy Windows không
    /// vẽ con trỏ vào khung hình mà gửi riêng lệnh 3/4/28).
    cursor_canvas: Option<web_sys::HtmlCanvasElement>,
    cursor_ctx: Option<web_sys::CanvasRenderingContext2d>,
    /// Vị trí con trỏ đã vẽ lần trước (để xoá trước khi vẽ mới).
    cursor_drawn: Option<(i32, i32, u32, u32)>,
    /// Vùng ảnh đang hiển thị (khi chọn 1 màn hình thì chỉ hiện phần đó).
    view: Option<crate::screen::Rect>,
    /// Ép vẽ lại toàn bộ vùng đang hiển thị (đổi màn hình).
    full_redraw: bool,
    timer: Option<i32>,
}

/// Client xem màn hình UltraViewer.
#[wasm_bindgen]
pub struct UltraViewerClient {
    state: Rc<RefCell<State>>,
    callbacks: Rc<RefCell<Callbacks>>,
    /// Kênh điều khiển tới daemon — `RefCell` riêng với `state` (xem [`Control`]).
    control: Rc<RefCell<Control>>,
}

impl Default for UltraViewerClient {
    fn default() -> Self {
        Self::new()
    }
}

/// Relay đi qua WebSocket tới daemon.
struct WsRelay {
    ws: web_sys::WebSocket,
    /// Kênh điều khiển dùng chung với tầng glue — `RefCell` riêng với
    /// `State` nên gọi từ đây không bao giờ xung đột khoá với phần state.
    control: Rc<RefCell<Control>>,
}

impl WsRelay {
    fn request(channel: u8, host: &str, port: u16, cert_host: &str) -> String {
        format!(
            "{{\"t\":\"open\",\"c\":{},\"host\":{},\"port\":{},\"sni\":\"ultraviewer\",\"cert\":{}}}",
            channel,
            json_string(host),
            port,
            json_string(cert_host)
        )
    }

    /// Gửi message điều khiển tới daemon. Nếu WebSocket còn đang CONNECTING thì
    /// xếp vào hàng đợi (gửi ngay sẽ ném `InvalidStateError`).
    fn send_control(&mut self, request: String) -> crate::wire::Result<()> {
        let mut control = self.control.borrow_mut();
        control.pending.push(request);
        flush_control(&mut control);
        Ok(())
    }
}

impl Relay for WsRelay {
    fn open(&mut self, channel: u8, host: &str, port: u16, cert_host: &str) -> crate::wire::Result<()> {
        self.send_control(Self::request(channel, host, port, cert_host))
    }

    fn write(&mut self, channel: u8, bytes: &[u8]) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if bytes.is_empty() {
            return Ok(());
        }
        let mut payload = Vec::with_capacity(bytes.len() + 1);
        payload.push(channel);
        payload.extend_from_slice(bytes);
        self.ws
            .send_with_u8_array(&payload)
            .map_err(|e| format!("Could not reach the local agent: {e:?}").into())
    }

    fn close(&mut self, channel: u8) {
        let _ = self.send_control(format!("{{\"t\":\"close\",\"c\":{}}}", channel));
    }

    fn listen_direct(&mut self) -> crate::wire::Result<()> {
        // Yêu cầu daemon mở listener LAN để máy đối tác kết nối thẳng.
        self.send_control(format!("{{\"t\":\"listen\",\"c\":{}}}", CHANNEL_DIRECT))
    }

    fn close_direct_listener(&mut self) {
        let _ = self.send_control(format!("{{\"t\":\"listen_close\",\"c\":{}}}", CHANNEL_DIRECT));
    }
}

#[wasm_bindgen]
impl UltraViewerClient {
    #[wasm_bindgen(constructor)]
    pub fn new() -> UltraViewerClient {
        let control = Rc::new(RefCell::new(Control {
            ws: None,
            open: false,
            pending: Vec::new(),
        }));
        UltraViewerClient {
            state: Rc::new(RefCell::new(State {
                frame_count: 0,
                queue: Vec::new(),
                session: None,
                observer: SharedObserver::default(),
                canvas: None,
                ctx: None,
                cursor_canvas: None,
                cursor_ctx: None,
                cursor_drawn: None,
                view: None,
                full_redraw: false,
                timer: None,
            })),
            callbacks: Rc::new(RefCell::new(Callbacks::default())),
            control,
        }
    }

    /// Gắn canvas để vẽ màn hình từ xa.
    pub fn attach_canvas(&self, canvas: web_sys::HtmlCanvasElement) {
        let mut state = self.state.borrow_mut();
        let ctx = canvas
            .get_context("2d")
            .ok()
            .flatten()
            .and_then(|c| c.dyn_into::<web_sys::CanvasRenderingContext2d>().ok());
        state.ctx = ctx;
        state.canvas = Some(canvas);
    }

    /// Gắn canvas phủ để vẽ con trỏ của máy đối tác.
    pub fn attach_cursor_canvas(&self, canvas: web_sys::HtmlCanvasElement) {
        let mut state = self.state.borrow_mut();
        let ctx = canvas
            .get_context("2d")
            .ok()
            .flatten()
            .and_then(|c| c.dyn_into::<web_sys::CanvasRenderingContext2d>().ok());
        state.cursor_ctx = ctx;
        state.cursor_canvas = Some(canvas);
    }

    pub fn on_status(&self, callback: js_sys::Function) {
        self.callbacks.borrow_mut().status = Some(callback);
    }
    pub fn on_connected(&self, callback: js_sys::Function) {
        self.callbacks.borrow_mut().connected = Some(callback);
    }
    pub fn on_view_only(&self, callback: js_sys::Function) {
        self.callbacks.borrow_mut().view_only = Some(callback);
    }
    pub fn on_chat(&self, callback: js_sys::Function) {
        self.callbacks.borrow_mut().chat = Some(callback);
    }
    pub fn on_typing(&self, callback: js_sys::Function) {
        self.callbacks.borrow_mut().typing = Some(callback);
    }
    pub fn on_clipboard(&self, callback: js_sys::Function) {
        self.callbacks.borrow_mut().clipboard = Some(callback);
    }
    pub fn on_closed(&self, callback: js_sys::Function) {
        self.callbacks.borrow_mut().closed = Some(callback);
    }

    /// Mở phiên: kết nối WebSocket tới daemon rồi đăng ký + tra cứu máy đối tác.
    ///
    /// `allow_direct`: cho phép dùng đường LAN trực tiếp khi 2 máy cùng mạng
    /// (bỏ qua relay → độ trễ thấp hơn, nội dung không rời LAN).
    #[allow(clippy::too_many_arguments)]
    pub fn connect(
        &self,
        ws_url: String,
        partner_id: String,
        password: String,
        display_name: String,
        device_identity: String,
        device_password: String,
        tz_offset_minutes: i32,
        local_width: u32,
        local_height: u32,
        allow_direct: bool,
    ) -> Result<(), JsValue> {
        self.disconnect();

        let ws = web_sys::WebSocket::new(&ws_url).map_err(|e| JsValue::from_str(&format!("{e:?}")))?;
        ws.set_binary_type(web_sys::BinaryType::Arraybuffer);

        let options = ConnectOptions {
            partner_id,
            password,
            display_name,
            device_identity,
            device_password,
            local_screen: (local_width, local_height),
            tz_offset_minutes,
            local_ip: String::new(),
            allow_direct,
        };

        {
            let mut control = self.control.borrow_mut();
            control.ws = Some(ws.clone());
            control.open = false;
            control.pending.clear();
        }

        self.install_ws_handlers(&ws);
        self.start_timer();

        let observer = SharedObserver::default();
        let session = Session::new(
            Box::new(WsRelay { ws: ws.clone(), control: self.control.clone() }),
            Box::new(observer.clone()),
            options,
        )
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

        {
            let mut state = self.state.borrow_mut();
            state.observer = observer;
            state.session = Some(session);
        }

        // Bắt đầu phiên: session tự yêu cầu mở kênh lệnh tới relay.
        // Session phải được lấy ra khỏi state trước khi gọi start() vì
        // start() → relay.open() → xếp hàng đợi message → borrow_mut() lại
        // kênh điều khiển (RefCell riêng nên an toàn, nhưng vẫn lấy ra cho
        // đúng thứ tự: state không chứa session trong lúc start).
        let mut session = self.state.borrow_mut().session.take().expect("session đã tạo");
        let started = session.start(now_ms());
        self.state.borrow_mut().session = Some(session);
        started.map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(())
    }

    /// Ngắt phiên.
    pub fn disconnect(&self) {
        self.stop_timer();
        {
            let mut state = self.state.borrow_mut();
            if let Some(session) = state.session.as_mut() {
                // session.close() → relay.close() → gửi message điều khiển:
                // kênh điều khiển dùng `RefCell` riêng nên không xung đột với
                // khoá của `state` (trước đây dùng chung → panic RefCell).
                session.close();
            }
            state.session = None;
            state.queue.clear();
        }
        let mut control = self.control.borrow_mut();
        control.pending.clear();
        control.open = false;
        if let Some(ws) = control.ws.take() {
            let _ = ws.close();
        }
    }

    /// Số khung hình đã giải mã và vẽ lên canvas.
    pub fn frame_count(&self) -> u64 {
        self.state.borrow().frame_count
    }

    /// Số màn hình của máy đối tác.
    pub fn monitor_count(&self) -> usize {
        self.state
            .borrow()
            .session
            .as_ref()
            .map(|s| s.monitor_count())
            .unwrap_or(0)
    }

    /// Màn hình đang chọn (0 = tất cả).
    pub fn selected_monitor(&self) -> usize {
        self.state
            .borrow()
            .session
            .as_ref()
            .map(|s| s.selected_monitor())
            .unwrap_or(0)
    }

    /// Chọn màn hình hiển thị (0 = tất cả, 1..n = màn hình thứ n).
    pub fn select_monitor(&self, index: usize) {
        let mut inner = self.state.borrow_mut();
        let Some(session) = inner.session.as_mut() else { return };
        if !session.set_monitor(index) {
            return;
        }
        inner.view = session.view_rect();
        inner.full_redraw = true;
        inner.cursor_drawn = None;
        // Canvas đổi kích thước theo vùng đang hiển thị.
        if let (Some(view), Some(canvas)) = (inner.view, inner.canvas.as_ref()) {
            canvas.set_width(view.width);
            canvas.set_height(view.height);
        }
    }

    /// Gốc toạ độ desktop ảo của máy đối tác (chẩn đoán).
    pub fn virtual_origin(&self) -> Vec<i32> {
        let (x, y) = self
            .state
            .borrow()
            .session
            .as_ref()
            .map(|s| s.virtual_origin())
            .unwrap_or((0, 0));
        vec![x, y]
    }

    /// Lệch của vùng đang hiển thị so với ảnh (cộng vào toạ độ chuột).
    pub fn view_offset(&self) -> Vec<i32> {
        let (x, y) = self
            .state
            .borrow()
            .session
            .as_ref()
            .map(|s| s.view_offset())
            .unwrap_or((0, 0));
        vec![x, y]
    }

    /// Vị trí con trỏ của máy đối tác (chẩn đoán).
    pub fn cursor_position(&self) -> Option<Vec<i32>> {
        self.state
            .borrow()
            .session
            .as_ref()
            .and_then(|s| s.cursor_position())
            .map(|(x, y)| vec![x, y])
    }

    /// Thống kê khung hình: (số khung, tổng ms giải mã, tổng byte nén).
    pub fn frame_stats(&self) -> Vec<f64> {
        let (frames, millis, bytes) = self
            .state
            .borrow()
            .session
            .as_ref()
            .map(|s| s.frame_stats())
            .unwrap_or((0, 0, 0));
        vec![frames as f64, millis as f64, bytes as f64]
    }

    /// Các payload đã gửi tới máy đối tác (chẩn đoán).
    pub fn sent_payloads(&self) -> Vec<String> {
        self.state
            .borrow()
            .session
            .as_ref()
            .map(|s| s.sent_payloads().to_vec())
            .unwrap_or_default()
    }

    /// Danh sách lệnh đã nhận từ máy đối tác (chẩn đoán).
    pub fn received_commands(&self) -> Vec<u8> {
        self.state
            .borrow()
            .session
            .as_ref()
            .map(|s| s.received_commands().to_vec())
            .unwrap_or_default()
    }

    pub fn is_connected(&self) -> bool {
        self.state.borrow().session.as_ref().map(|s| s.is_connected()).unwrap_or(false)
    }

    pub fn is_view_only(&self) -> bool {
        self.state.borrow().session.as_ref().map(|s| s.is_view_only()).unwrap_or(false)
    }

    /// Đang dùng đường LAN trực tiếp (true) hay đi qua relay (false).
    pub fn is_direct_route(&self) -> bool {
        self.state.borrow().session.as_ref().map(|s| s.is_direct_route()).unwrap_or(false)
    }

    /// Listener LAN đã mở: [ip, cổng] (rỗng nếu chưa có).
    pub fn direct_listener(&self) -> Vec<String> {
        self.state
            .borrow()
            .session
            .as_ref()
            .and_then(|s| s.direct_listener())
            .map(|(ip, port)| vec![ip, port.to_string()])
            .unwrap_or_default()
    }

    /// Bật/tắt đường LAN trực tiếp giữa phiên.
    ///
    /// Tắt thì đóng listener LAN và quay về đường relay ngay. Bật lại thì
    /// chỉ có tác dụng ở lần kết nối tiếp theo (lệnh tra cứu đã gửi rồi).
    pub fn set_allow_direct(&self, allow: bool) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.set_allow_direct(allow);
        }
    }

    /// Bật/tắt gửi chuột & bàn phím tới máy đối tác.
    pub fn set_control_enabled(&self, enabled: bool) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.set_control_enabled(enabled);
        }
    }

    pub fn is_control_enabled(&self) -> bool {
        self.state.borrow().session.as_ref().map(|s| s.is_control_enabled()).unwrap_or(false)
    }

    /// Kích thước màn hình từ xa hiện tại (0 nếu chưa có).
    pub fn screen_size(&self) -> Vec<u32> {
        let state = self.state.borrow();
        let (w, h) = state.session.as_ref().map(|s| s.screen_size()).unwrap_or((0, 0));
        vec![w, h]
    }

    pub fn pointer_move(&self, x: i32, y: i32) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.on_pointer_move(x, y);
        }
    }

    pub fn pointer_button(&self, button: u8, pressed: bool, x: i32, y: i32) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.on_pointer_button(button, pressed, x, y);
        }
    }

    pub fn wheel(&self, lines: f64) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.on_wheel(lines);
        }
    }

    pub fn key(&self, code: String, pressed: bool, text: Option<String>) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.on_key(&code, pressed, text.as_deref());
        }
    }

    pub fn modifiers(&self, shift: bool, ctrl: bool, alt: bool, meta: bool, caps: bool) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.on_modifiers(shift, ctrl, alt, meta, caps);
        }
    }

    /// Nhả toàn bộ phím đang giữ (mất focus hoặc ngắt kết nối).
    pub fn release_input(&self) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.release_input();
        }
    }

    pub fn send_chat(&self, text: String) -> Result<(), JsValue> {
        let mut state = self.state.borrow_mut();
        match state.session.as_mut() {
            Some(session) => session.send_chat(&text).map_err(|e| JsValue::from_str(&e.to_string())),
            None => Err(JsValue::from_str("The remote session is not connected.")),
        }
    }

    pub fn set_clipboard_sharing(&self, enabled: bool) {
        let mut state = self.state.borrow_mut();
        if let Some(session) = state.session.as_mut() {
            session.set_clipboard_sharing(enabled);
        }
    }

    pub fn send_clipboard(&self, text: String) -> Result<(), JsValue> {
        let mut state = self.state.borrow_mut();
        match state.session.as_mut() {
            Some(session) => session.send_clipboard(&text).map_err(|e| JsValue::from_str(&e.to_string())),
            None => Err(JsValue::from_str("The remote session is not connected.")),
        }
    }

    /// Xử lý các sự kiện đang chờ (được gọi tự động bởi timer và WebSocket).
    pub fn pump(&self) {
        pump(&self.state, &self.callbacks);
    }
}

impl UltraViewerClient {
    fn install_ws_handlers(&self, ws: &web_sys::WebSocket) {
        // Socket vừa mở: gửi các message điều khiển đang chờ.
        let weak_control = Rc::downgrade(&self.control);
        let on_open = Closure::<dyn FnMut(web_sys::Event)>::new(move |_event: web_sys::Event| {
            let Some(control) = weak_control.upgrade() else { return };
            let mut inner = control.borrow_mut();
            inner.open = true;
            flush_control(&mut inner);
        });
        ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
        on_open.forget();

        let weak = Rc::downgrade(&self.state);
        let weak_callbacks = Rc::downgrade(&self.callbacks);
        let on_message = Closure::<dyn FnMut(web_sys::MessageEvent)>::new(move |event: web_sys::MessageEvent| {
            let (Some(state), Some(callbacks)) = (weak.upgrade(), weak_callbacks.upgrade()) else {
                return;
            };
            let data = event.data();
            if let Some(text) = data.as_string() {
                handle_control(&state, &text);
                pump(&state, &callbacks);
                return;
            }
            if let Ok(buffer) = data.clone().dyn_into::<js_sys::ArrayBuffer>() {
                let bytes = js_sys::Uint8Array::new(&buffer).to_vec();
                if bytes.is_empty() {
                    return;
                }
                let channel = bytes[0];
                let payload = bytes[1..].to_vec();
                state.borrow_mut().queue.push(SessionEvent::Data { channel, bytes: payload });
                // Xử lý ngay: chờ timer 250ms sẽ làm khung hình bị trễ.
                pump(&state, &callbacks);
            }
        });
        ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
        on_message.forget();

        let weak = Rc::downgrade(&self.state);
        let weak_callbacks = Rc::downgrade(&self.callbacks);
        let on_close = Closure::<dyn FnMut(web_sys::CloseEvent)>::new(move |event: web_sys::CloseEvent| {
            let (Some(state), Some(callbacks)) = (weak.upgrade(), weak_callbacks.upgrade()) else {
                return;
            };
            let reason = event.reason();
            let message = if reason.is_empty() {
                "The local agent closed the connection.".to_string()
            } else {
                reason
            };
            state.borrow_mut().queue.push(SessionEvent::Closed { channel: CHANNEL_COMMAND, message });
            pump(&state, &callbacks);
        });
        ws.set_onclose(Some(on_close.as_ref().unchecked_ref()));
        on_close.forget();

        let weak = Rc::downgrade(&self.state);
        let weak_callbacks = Rc::downgrade(&self.callbacks);
        let on_error = Closure::<dyn FnMut(web_sys::ErrorEvent)>::new(move |_event: web_sys::ErrorEvent| {
            let (Some(state), Some(callbacks)) = (weak.upgrade(), weak_callbacks.upgrade()) else {
                return;
            };
            state.borrow_mut().queue.push(SessionEvent::OpenFailed {
                channel: CHANNEL_COMMAND,
                message: "Could not reach the local agent.".to_string(),
            });
            pump(&state, &callbacks);
        });
        ws.set_onerror(Some(on_error.as_ref().unchecked_ref()));
        on_error.forget();
    }

    fn start_timer(&self) {
        self.stop_timer();
        let Some(window) = web_sys::window() else { return };
        let weak_state = Rc::downgrade(&self.state);
        let weak_callbacks = Rc::downgrade(&self.callbacks);
        let callback = Closure::<dyn FnMut()>::new(move || {
            let (Some(state), Some(callbacks)) = (weak_state.upgrade(), weak_callbacks.upgrade()) else {
                return;
            };
            let now = now_ms();
            // Session được lấy RA khỏi state trước khi gọi tick/flush_pointer:
            // các hàm này có thể gọi lại relay (đóng kênh, đóng listener LAN)
            // và observer. Nếu vẫn giữ khoá `state` thì một lần gọi lại vào
            // cùng `RefCell` sẽ panic → wasm trap `unreachable` → phiên chết.
            let taken = state.borrow_mut().session.take();
            if let Some(mut session) = taken {
                // Gửi vị trí chuột theo nhịp giới hạn (xem POINTER_SEND_INTERVAL_MS)
                // và kiểm tra deadline/heartbeat.
                session.flush_pointer(now);
                session.tick(now);
                state.borrow_mut().session = Some(session);
            }
            // Đẩy sự kiện ra ngoài sau khi trả khoá.
            pump(&state, &callbacks);
        });
        // 16ms ≈ 1 khung hình: đủ để gửi vị trí chuột mà không tốn CPU.
        let handle =
            window.set_interval_with_callback_and_timeout_and_arguments_0(callback.as_ref().unchecked_ref(), 16);
        callback.forget();
        if let Ok(handle) = handle {
            let mut state = self.state.borrow_mut();
            state.timer = Some(handle);
        }
    }

    fn stop_timer(&self) {
        let mut state = self.state.borrow_mut();
        if let Some(handle) = state.timer.take() {
            if let Some(window) = web_sys::window() {
                window.clear_interval_with_handle(handle);
            }
        }
    }
}

/// Gửi các message điều khiển đang chờ (sau khi WebSocket mở).
fn flush_control(control: &mut Control) {
    if !control.open || control.pending.is_empty() {
        return;
    }
    let Some(ws) = control.ws.as_ref() else { return };
    let pending = std::mem::take(&mut control.pending);
    for request in pending {
        if ws.send_with_str(&request).is_err() {
            // Socket vừa đóng: đưa message về hàng đợi để thử lại sau.
            control.pending.push(request);
            control.open = false;
            return;
        }
    }
}

/// Xử lý hàng đợi sự kiện rồi gửi ra tầng JS.
fn pump(state: &Rc<RefCell<State>>, callbacks: &Rc<RefCell<Callbacks>>) {
    drain_queue(state);
    dispatch_events(state, callbacks);
    paint(state);
    paint_cursor(state);
}

fn drain_queue(state: &Rc<RefCell<State>>) {
    let now = now_ms();
    // Lấy session ra khỏi state TRƯỚC khi xử lý: khi phiên mở kênh mới
    // (relay.open) tầng truyền tải cần borrow_mut() state — nếu vẫn giữ khoá
    // thì RefCell panic.
    let (queue, session) = {
        let mut inner = state.borrow_mut();
        let queue = std::mem::take(&mut inner.queue);
        let session = inner.session.take();
        (queue, session)
    };
    if queue.is_empty() {
        if let Some(session) = session {
            state.borrow_mut().session = Some(session);
        }
        return;
    }
    let Some(mut session) = session else { return };
    for event in queue {
        session.handle(event, now);
    }
    state.borrow_mut().session = Some(session);
}

fn dispatch_events(state: &Rc<RefCell<State>>, callbacks: &Rc<RefCell<Callbacks>>) {
    let events = {
        let inner = state.borrow();
        let mut observer = inner.observer.inner.borrow_mut();
        std::mem::take(&mut observer.events)
    };
    if events.is_empty() {
        return;
    }
    let callbacks = callbacks.borrow().clone();
    for event in events {
        match event {
            OutEvent::Status(message) => {
                if let Some(f) = callbacks.status.as_ref() {
                    let _ = f.call1(&JsValue::UNDEFINED, &JsValue::from_str(&message));
                }
            }
            OutEvent::Connected(width, height) => {
                resize_canvas(state, width, height);
                if let Some(f) = callbacks.connected.as_ref() {
                    let _ = f.call2(&JsValue::UNDEFINED, &JsValue::from_f64(width as f64), &JsValue::from_f64(height as f64));
                }
            }
            OutEvent::ViewOnly(view_only) => {
                if let Some(f) = callbacks.view_only.as_ref() {
                    let _ = f.call1(&JsValue::UNDEFINED, &JsValue::from_bool(view_only));
                }
            }
            OutEvent::Frame => {
                state.borrow_mut().frame_count += 1;
            }
            OutEvent::Chat(text) => {
                if let Some(f) = callbacks.chat.as_ref() {
                    let _ = f.call1(&JsValue::UNDEFINED, &JsValue::from_str(&text));
                }
            }
            OutEvent::Typing(typing) => {
                if let Some(f) = callbacks.typing.as_ref() {
                    let _ = f.call1(&JsValue::UNDEFINED, &JsValue::from_bool(typing));
                }
            }
            OutEvent::Clipboard(text) => {
                if let Some(f) = callbacks.clipboard.as_ref() {
                    let _ = f.call1(&JsValue::UNDEFINED, &JsValue::from_str(&text));
                }
            }
            OutEvent::Closed(message) => {
                if let Some(f) = callbacks.closed.as_ref() {
                    let _ = f.call1(&JsValue::UNDEFINED, &JsValue::from_str(&message));
                }
            }
        }
    }
}

fn resize_canvas(state: &Rc<RefCell<State>>, width: u32, height: u32) {
    let mut inner = state.borrow_mut();
    if let Some(canvas) = inner.canvas.as_ref() {
        canvas.set_width(width);
        canvas.set_height(height);
    }
    if let Some(canvas) = inner.cursor_canvas.as_ref() {
        canvas.set_width(width);
        canvas.set_height(height);
    }
    inner.cursor_drawn = None;
}

fn paint(state: &Rc<RefCell<State>>) {
    // Lấy vùng đang hiển thị + các vùng vừa thay đổi trong một khối borrow
    // riêng, để không giữ khoá `state` khi vẽ.
    let (view, dirty, ctx) = {
        let mut inner = state.borrow_mut();
        let full = inner.full_redraw;
        inner.full_redraw = false;
        let cached_view = inner.view;
        let ctx = inner.ctx.clone();
        let Some(session) = inner.session.as_mut() else { return };
        let view = session.view_rect().or(cached_view);
        let Some(view) = view else { return };
        let dirty = if full { vec![view] } else { session.take_dirty() };
        (view, dirty, ctx)
    };
    let Some(ctx) = ctx else { return };
    for rect in dirty {
        // Cắt vùng thay đổi theo vùng đang hiển thị.
        let x0 = rect.x.max(view.x);
        let y0 = rect.y.max(view.y);
        let x1 = ((rect.x as i64 + rect.width as i64).min(view.x as i64 + view.width as i64)) as i32;
        let y1 = ((rect.y as i64 + rect.height as i64).min(view.y as i64 + view.height as i64)) as i32;
        if x1 <= x0 || y1 <= y0 {
            continue;
        }
        let sub = crate::screen::Rect {
            x: x0,
            y: y0,
            width: (x1 - x0) as u32,
            height: (y1 - y0) as u32,
        };
        let pixels = {
            let inner = state.borrow();
            let Some(session) = inner.session.as_ref() else { continue };
            session.region_pixels(sub)
        };
        let Some(pixels) = pixels else { continue };
        let data = wasm_bindgen::Clamped(&pixels[..]);
        let Ok(image) = web_sys::ImageData::new_with_u8_clamped_array_and_sh(data, sub.width, sub.height) else {
            continue;
        };
        let _ = ctx.put_image_data(&image, (sub.x - view.x) as f64, (sub.y - view.y) as f64);
    }
}

/// Đặt khung của canvas con trỏ trùng với canvas màn hình.
///
/// Canvas màn hình được canh giữa trong container (flex + max-width/max-height)
/// còn canvas con trỏ nằm absolute nên phải đặt lại tọa độ/kích thước theo
/// khung thực tế của canvas màn hình, nếu không con trỏ sẽ lệch chỗ.
fn sync_cursor_canvas_box(state: &Rc<RefCell<State>>) {
    let inner = state.borrow();
    let (Some(screen), Some(cursor)) = (inner.canvas.as_ref(), inner.cursor_canvas.as_ref()) else {
        return;
    };
    let Some(container) = screen.parent_element() else { return };
    let screen_rect = screen.get_bounding_client_rect();
    let container_rect = container.get_bounding_client_rect();
    let style = cursor.style();
    let _ = style.set_property(
        "left",
        &format!("{}px", screen_rect.left() - container_rect.left()),
    );
    let _ = style.set_property(
        "top",
        &format!("{}px", screen_rect.top() - container_rect.top()),
    );
    let _ = style.set_property("width", &format!("{}px", screen_rect.width()));
    let _ = style.set_property("height", &format!("{}px", screen_rect.height()));
}

/// Vẽ con trỏ của máy đối tác lên canvas phủ.
fn paint_cursor(state: &Rc<RefCell<State>>) {
    // Lấy vị trí + ảnh con trỏ (ảnh là 0xAARRGGBB, top-down).
    let (position, image, origin) = {
        let inner = state.borrow();
        let Some(session) = inner.session.as_ref() else { return };
        (
            session.cursor_position(),
            session.cursor_image(),
            // Vị trí con trỏ là toạ độ desktop ảo → trừ gốc desktop ảo.
            session.virtual_origin(),
        )
    };
    let Some((x, y)) = position else { return };
    // Toạ độ con trỏ là trên desktop ảo → trừ gốc của vùng đang hiển thị.
    let (x, y) = (x - origin.0, y - origin.1);
    sync_cursor_canvas_box(state);
    let (width, height, hot_x, hot_y, pixels) = match image {
        Some(image) => image,
        // Chưa có hình con trỏ: dùng mũi tên mặc định.
        None => {
            let arrow = crate::cursor::default_arrow();
            (arrow.width, arrow.height, arrow.hot_x, arrow.hot_y, arrow.pixels)
        }
    };
    if width == 0 || height == 0 {
        return;
    }

    let mut inner = state.borrow_mut();
    // Xoá con trỏ ở vị trí cũ.
    if let Some((old_x, old_y, old_w, old_h)) = inner.cursor_drawn.take() {
        if let Some(ctx) = inner.cursor_ctx.as_ref() {
            ctx.clear_rect(old_x as f64, old_y as f64, old_w as f64, old_h as f64);
        }
    }
    let Some(ctx) = inner.cursor_ctx.as_ref() else { return };

    // 0xAARRGGBB → RGBA.
    let mut rgba = Vec::with_capacity(width * height * 4);
    for px in &pixels {
        rgba.push((px >> 16) as u8);
        rgba.push((px >> 8) as u8);
        rgba.push(*px as u8);
        rgba.push((px >> 24) as u8);
    }
    let data = wasm_bindgen::Clamped(&rgba[..]);
    let Ok(image) = web_sys::ImageData::new_with_u8_clamped_array_and_sh(data, width as u32, height as u32) else {
        return;
    };
    // Vị trí trỏ chuột là điểm nóng của ảnh.
    let draw_x = x - hot_x as i32;
    let draw_y = y - hot_y as i32;
    let _ = ctx.put_image_data(&image, draw_x as f64, draw_y as f64);
    inner.cursor_drawn = Some((draw_x, draw_y, width as u32, height as u32));
}

/// Xử lý message điều khiển (JSON) từ daemon.
fn handle_control(state: &Rc<RefCell<State>>, text: &str) {
    let Ok(parsed) = js_sys::JSON::parse(text) else { return };
    let kind = js_sys::Reflect::get(&parsed, &JsValue::from_str("t"))
        .ok()
        .and_then(|v| v.as_string())
        .unwrap_or_default();
    let channel = js_sys::Reflect::get(&parsed, &JsValue::from_str("c"))
        .ok()
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0) as u8;
    let message = js_sys::Reflect::get(&parsed, &JsValue::from_str("m"))
        .ok()
        .and_then(|v| v.as_string())
        .unwrap_or_default();
    let mut inner = state.borrow_mut();
    match kind.as_str() {
        "open_ok" => {
            if let Some(ip) = js_sys::Reflect::get(&parsed, &JsValue::from_str("ip"))
                .ok()
                .and_then(|v| v.as_string())
            {
                if let Some(session) = inner.session.as_mut() {
                    session.set_local_ip(&ip);
                }
            }
            inner.queue.push(SessionEvent::Opened { channel });
        }
        "open_err" => inner.queue.push(SessionEvent::OpenFailed { channel, message }),
        "closed" => inner.queue.push(SessionEvent::Closed { channel, message }),
        "listen_ok" => {
            // Daemon đã mở listener LAN: lấy IP/cổng/khoá để quảng bá trong
            // lệnh tra cứu máy đối tác.
            let ip = js_sys::Reflect::get(&parsed, &JsValue::from_str("ip"))
                .ok()
                .and_then(|v| v.as_string())
                .unwrap_or_default();
            let port = js_sys::Reflect::get(&parsed, &JsValue::from_str("port"))
                .ok()
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0) as u16;
            let key = js_sys::Reflect::get(&parsed, &JsValue::from_str("key"))
                .ok()
                .and_then(|v| v.as_string())
                .unwrap_or_default();
            inner.queue.push(SessionEvent::DirectReady { ip, port, key });
        }
        "listen_err" => inner.queue.push(SessionEvent::DirectFailed { message }),
        "direct_connected" => {
            // Máy đối tác đã kết nối thẳng vào listener LAN.
            let ip = js_sys::Reflect::get(&parsed, &JsValue::from_str("ip"))
                .ok()
                .and_then(|v| v.as_string())
                .unwrap_or_default();
            inner.queue.push(SessionEvent::DirectConnected { ip });
        }
        _ => {}
    }
}

/// Đóng gói chuỗi thành JSON string.
fn json_string(value: &str) -> String {
    let mut out = String::with_capacity(value.len() + 2);
    out.push('"');
    for ch in value.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Thời gian hiện tại (ms) theo `performance.now()`.
fn now_ms() -> f64 {
    web_sys::window()
        .and_then(|w| w.performance())
        .map(|p| p.now())
        // Node (test) không có `window` → dùng Date.now().
        .unwrap_or_else(|| js_sys::Date::now())
}
