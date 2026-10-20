//! UltraViewer client (Rust → WebAssembly).
//!
//! Xem màn hình và điều khiển máy khác đang chạy UltraViewer (Windows) qua
//! relay của UltraViewer. Phần giao thức được port từ dự án MacViewer
//! (https://github.com/DeanOpen/MacViewer, giấy phép MIT).
//!
//! Kiến trúc trong trình duyệt:
//!   - `session`  : máy trạng thái của phiên (đăng ký → tra cứu → login → màn hình)
//!   - `transport`: giao diện tới relay; trong WASM được cài bằng WebSocket tới daemon
//!   - `wasm_glue`: nối transport với WebSocket + vẽ khung hình lên canvas
//!
//! Phần giao thức (`wire`, `messages`, `screen`, `input`, `chat`, `clipboard`)
//! là Rust thuần nên chạy được `cargo test` không cần trình duyệt.

pub mod chat;
pub mod clipboard;
pub mod cursor;
pub mod input;
pub mod messages;
pub mod screen;
pub mod session;
pub mod transport;
pub mod wire;

#[cfg(target_arch = "wasm32")]
pub mod wasm_glue;
