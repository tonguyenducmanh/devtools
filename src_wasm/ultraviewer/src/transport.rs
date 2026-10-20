//! Kênh truyền tới relay UltraViewer.
//!
//! Trình duyệt không mở được socket thô (không có TLS client trong WASM), nên
//! daemon (Go) đóng vai trò trung gian: mở TCP + TLS tới relay rồi chuyển byte
//! hai chiều qua WebSocket. Module này chỉ mô tả giao diện (trait `Relay`) và
//! cách tách khung (length-prefixed frame) + bỏ header HTTP của relay.
//!
//! Mỗi "kênh" là một kết nối TCP/TLS riêng:
//!   - `CHANNEL_COMMAND`: functions3.ultraviewer.net:443 (đăng ký + tra cứu)
//!   - `CHANNEL_PEER`: relay được giao (màn hình + điều khiển)

use crate::wire::{encode_frame, Result, MAX_FRAME};

/// Kênh lệnh (đăng ký viewer + tra cứu máy đối tác).
pub const CHANNEL_COMMAND: u8 = 1;
/// Kênh dữ liệu với máy đối tác (màn hình + bàn phím/chuột).
pub const CHANNEL_PEER: u8 = 2;

/// Một kết nối logic tới relay.
pub trait Relay {
    /// Yêu cầu mở kênh tới `host:port` (daemon lo phần TLS với `cert_host`).
    /// Kết quả thật sẽ được báo lại qua [`SessionEvent::Opened`].
    fn open(&mut self, channel: u8, host: &str, port: u16, cert_host: &str) -> Result<()>;

    /// Ghi byte thô xuống relay (daemon gửi nguyên vẹn qua socket).
    fn write(&mut self, channel: u8, bytes: &[u8]) -> Result<()>;

    /// Đóng kênh.
    fn close(&mut self, channel: u8);
}

/// Sự kiện đến từ tầng truyền tải.
#[derive(Debug)]
pub enum SessionEvent {
    /// Kênh đã mở thành công (TCP + TLS xong).
    Opened { channel: u8 },
    /// Mở kênh thất bại (DNS, kết nối hoặc chứng thư ký TLS).
    OpenFailed { channel: u8, message: String },
    /// Kênh bị đóng.
    Closed { channel: u8, message: String },
    /// Byte thô đến từ relay.
    Data { channel: u8, bytes: Vec<u8> },
}

/// Bộ tách khung cho một kênh: bỏ header HTTP của relay rồi cắt frame
/// length-prefixed (4 byte LE) — xem `LengthPrefixedFrame.swift`.
#[derive(Default)]
pub struct FrameReader {
    buf: Vec<u8>,
    /// `Some` khi chưa tìm thấy kết thúc header HTTP (`\r\n\r\n`).
    header: Option<Vec<u8>>,
}

impl FrameReader {
    pub fn new() -> Self {
        FrameReader { buf: Vec::new(), header: Some(Vec::new()) }
    }

    /// Bỏ header HTTP của relay (chỉ lần đầu của mỗi kênh).
    fn skip_http_header(&mut self, bytes: &[u8]) -> Result<()> {
        const MAX_HTTP_HEADER: usize = 32 * 1024;
        if self.header.is_none() {
            self.buf.extend_from_slice(bytes);
            return Ok(());
        }
        let mut header = self.header.take().unwrap();
        let mut consumed = 0usize;
        let mut done = false;
        for (i, &b) in bytes.iter().enumerate() {
            if header.len() >= MAX_HTTP_HEADER {
                return Err("relay HTTP response header is too large".into());
            }
            header.push(b);
            if header.len() >= 4 && header[header.len() - 4..] == *b"\r\n\r\n" {
                consumed = i + 1;
                done = true;
                break;
            }
        }
        if done {
            self.buf.extend_from_slice(&bytes[consumed..]);
        } else {
            self.header = Some(header);
        }
        Ok(())
    }

    /// Đẩy byte vào bộ đọc và lấy ra các frame hoàn chỉnh.
    pub fn push(&mut self, bytes: &[u8]) -> Result<Vec<Vec<u8>>> {
        self.skip_http_header(bytes)?;
        let mut frames = Vec::new();
        while let Some(frame) = take_frame(&mut self.buf)? {
            frames.push(frame);
        }
        Ok(frames)
    }
}

/// Cắt một frame length-prefixed ra khỏi buffer.
fn take_frame(buf: &mut Vec<u8>) -> Result<Option<Vec<u8>>> {
    if buf.len() < 4 {
        return Ok(None);
    }
    let n = u32::from_le_bytes([buf[0], buf[1], buf[2], buf[3]]) as usize;
    if n > MAX_FRAME {
        buf.clear();
        return Err("relay frame is too large".into());
    }
    if buf.len() < 4 + n {
        return Ok(None);
    }
    let frame = buf[4..4 + n].to_vec();
    buf.drain(..4 + n);
    Ok(Some(frame))
}

/// Bọc payload thành frame length-prefixed để gửi xuống relay.
pub fn frame_bytes(payload: &[u8]) -> Vec<u8> {
    encode_frame(payload)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frames_split_coalesced_and_partial() {
        let mut r = FrameReader::new();
        // Header HTTP phải bị bỏ trước khi lấy frame.
        let frames = r.push(b"HTTP/1.1 200 OK\r\nX: y\r\n\r\n").unwrap();
        assert!(frames.is_empty());
        // Frame 1 dài 3 nhưng mới gửi 2 byte → chưa đủ.
        let frames = r.push(&[3, 0, 0, 0, b'a', b'b']).unwrap();
        assert!(frames.is_empty());
        // Byte cuối của frame 1 + frame 2 dài 2 đến cùng lúc.
        let frames = r.push(&[b'c', 2, 0, 0, 0, b'z', b'w']).unwrap();
        assert_eq!(frames, vec![vec![b'a', b'b', b'c'], vec![b'z', b'w']]);
    }

    #[test]
    fn oversized_frame_is_rejected() {
        let mut buf = Vec::new();
        buf.extend_from_slice(&((MAX_FRAME + 1) as u32).to_le_bytes());
        assert!(take_frame(&mut buf).is_err());
    }
}
