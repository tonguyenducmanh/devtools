//! FileTransferOffer.swift + FileTransferEngine.swift: gửi/nhận tệp đính kèm
//! qua kênh peer (command 13/14/15/16/21). Module chỉ encode/decode + state
//! machine; routing thuộc về session. OWNER: net.
//!
//! Viewer → host: chuỗi UTF-16LE "13|||id|||tên|||cỡ" (cờ UTF-16), chunk là
//! header ASCII "15|||id|||offset|||" + byte thô (cờ ASCII). Host → viewer:
//! multipart [Int16LE lệnh][id UTF-8][trường...], cỡ/offset dạng Double8
//! (bản mới) hoặc Int32LE (bản cũ).

// ---------------------------------------------------------------------------
// Port từ MacViewer (https://github.com/DeanOpen/MacViewer) — giấy phép MIT,
// Copyright (c) 2026 MacViewer contributors. Xem LICENSE-MacViewer.
// ---------------------------------------------------------------------------

use std::collections::HashMap;

use crate::wire::{encode_multipart, utf16le, Result};

/// Cỡ một chunk tối đa (giống `maximumPartSize` của bản gốc).
pub const MAX_PART_SIZE: usize = 32_000;
/// Số transfer đồng thời tối đa.
pub const MAX_TRANSFERS: usize = 16;
/// Số chunk đang bay (chưa ack) tối đa — kiểm soát luồng như bản gốc.
pub const PARTS_IN_FLIGHT: usize = 2;
/// Giới hạn cỡ file (phải biểu diễn chính xác được bằng f64).
pub const MAX_FILE_SIZE: i64 = 999_999_999_999_999;
/// Giới hạn tên file: tối đa 1024 byte UTF-8, không chứa "|||", ký tự >= 32.
const MAX_NAME_BYTES: usize = 1024;

/// Lời đề nghị gửi file từ máy đối tác (hoặc do máy này tạo).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Offer {
    pub transfer_id: String,
    pub file_name: String,
    pub size: i64,
}

impl Offer {
    pub fn is_valid(&self) -> bool {
        valid_id(self.transfer_id.as_bytes()).is_some()
            && self.size >= 0
            && self.size <= MAX_FILE_SIZE
            && !self.file_name.is_empty()
            && self.file_name.len() <= MAX_NAME_BYTES
            && !self.file_name.contains("|||")
            && self.file_name.chars().all(|c| (c as u32) >= 32 && c != '\u{7f}')
    }

    /// Viewer → host: UTF-16LE "13|||id|||tên|||cỡ", cờ UTF-16.
    pub fn viewer_to_host(&self) -> (Vec<u8>, bool) {
        viewer_text(&format!(
            "13|||{}|||{}|||{}",
            self.transfer_id, self.file_name, self.size
        ))
    }

    /// Host → viewer: multipart [Int16LE 13][id][tên][Double8 cỡ].
    pub fn host_to_viewer(&self) -> Vec<u8> {
        encode_multipart(&[
            &[13, 0],
            self.transfer_id.as_bytes(),
            self.file_name.as_bytes(),
            &double8(self.size),
        ])
    }
}

/// Thông điệp transfer theo cả 2 chiều.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Message {
    Offer(Offer),
    /// Máy nhận đồng ý (offset luôn = 1, resume không được hỗ trợ).
    Accept { transfer_id: String },
    Chunk {
        transfer_id: String,
        offset: i64,
        data: Vec<u8>,
    },
    /// Xác nhận đã nhận 1 (hoặc nhóm) chunk.
    Acknowledgment { transfer_id: String },
    Cancel { transfer_id: String },
}

impl Message {
    pub fn transfer_id(&self) -> &str {
        match self {
            Message::Offer(offer) => &offer.transfer_id,
            Message::Accept { transfer_id }
            | Message::Chunk { transfer_id, .. }
            | Message::Acknowledgment { transfer_id }
            | Message::Cancel { transfer_id } => transfer_id,
        }
    }

    /// Encode theo chiều viewer → host. Chunk gửi byte thô (cờ ASCII),
    /// phần còn lại là chuỗi UTF-16LE (cờ UTF-16).
    pub fn viewer_encode(&self) -> (Vec<u8>, bool) {
        match self {
            Message::Offer(offer) => offer.viewer_to_host(),
            Message::Accept { transfer_id } => {
                viewer_text(&format!("14|||{transfer_id}|||1"))
            }
            Message::Cancel { transfer_id } => viewer_text(&format!("16|||{transfer_id}")),
            Message::Acknowledgment { transfer_id } => {
                viewer_text(&format!("21|||{transfer_id}"))
            }
            Message::Chunk {
                transfer_id,
                offset,
                data,
            } => {
                let mut payload =
                    format!("15|||{transfer_id}|||{offset}|||").into_bytes();
                payload.extend_from_slice(data);
                (payload, false)
            }
        }
    }

    /// Encode theo chiều host → viewer (multipart, cờ ASCII).
    pub fn host_encode(&self) -> Vec<u8> {
        match self {
            Message::Offer(offer) => offer.host_to_viewer(),
            Message::Accept { transfer_id } => encode_multipart(&[
                &[14, 0],
                transfer_id.as_bytes(),
                &[1, 0, 0, 0],
            ]),
            Message::Cancel { transfer_id } => {
                encode_multipart(&[&[16, 0], transfer_id.as_bytes()])
            }
            Message::Acknowledgment { transfer_id } => {
                encode_multipart(&[&[21, 0], transfer_id.as_bytes()])
            }
            Message::Chunk {
                transfer_id,
                offset,
                data,
            } => encode_multipart(&[
                &[15, 0],
                transfer_id.as_bytes(),
                &double8(*offset),
                data,
            ]),
        }
    }

    /// Decode multipart từ host (viewer nhận). Lệnh khác trả về None.
    pub fn decode_host_parts(parts: &[&[u8]]) -> Option<Message> {
        let command = *parts.first()?.first()?;
        if ![13, 14, 15, 16, 21].contains(&command) || !valid_command(parts[0], command) {
            return None;
        }
        match command {
            13 => {
                if parts.len() != 4 {
                    return None;
                }
                let id = valid_id(parts[1])?;
                let name = decode_name(parts[2])?;
                let size = integer_double(parts[3], 0)?;
                let offer = Offer {
                    transfer_id: id,
                    file_name: name,
                    size,
                };
                offer.is_valid().then_some(Message::Offer(offer))
            }
            15 => {
                if parts.len() != 4 {
                    return None;
                }
                let id = valid_id(parts[1])?;
                let offset = chunk_offset(parts[2])?;
                let data = parts[3];
                if data.is_empty() || data.len() > MAX_PART_SIZE {
                    return None;
                }
                Some(Message::Chunk {
                    transfer_id: id,
                    offset,
                    data: data.to_vec(),
                })
            }
            14 => {
                if parts.len() != 3 || parts[2].len() != 4 {
                    return None;
                }
                let id = valid_id(parts[1])?;
                let offset = u32::from_le_bytes([parts[2][0], parts[2][1], parts[2][2], parts[2][3]]);
                // Resume không được hỗ trợ — chỉ chấp nhận từ đầu file.
                (offset == 1).then_some(Message::Accept { transfer_id: id })
            }
            16 => {
                if parts.len() != 2 {
                    return None;
                }
                Some(Message::Cancel {
                    transfer_id: valid_id(parts[1])?,
                })
            }
            _ => {
                if parts.len() != 2 {
                    return None;
                }
                Some(Message::Acknowledgment {
                    transfer_id: valid_id(parts[1])?,
                })
            }
        }
    }

    /// Decode payload viewer → host (host nhận; dùng cho test đối xứng).
    /// Chỉ tách header — phần byte file có thể chứa bất kỳ delimiter nào.
    pub fn decode_viewer_payload(payload: &[u8]) -> Option<Message> {
        if payload.len() > MAX_PART_SIZE + 2048 {
            return None;
        }
        if payload.starts_with(b"15|||") {
            let fields = split_header(payload, 3);
            if fields.len() != 4 {
                return None;
            }
            let id = valid_id(fields[1])?;
            let offset = decimal(fields[2], 1)?;
            if fields[3].len() > MAX_PART_SIZE {
                return None;
            }
            return Some(Message::Chunk {
                transfer_id: id,
                offset,
                data: fields[3].to_vec(),
            });
        }
        let fields = split_header(payload, 4);
        let command = std::str::from_utf8(fields[0]).ok()?;
        if fields.len() < 2 {
            return None;
        }
        let id = valid_id(fields[1])?;
        match command {
            "13" => {
                if fields.len() != 4 {
                    return None;
                }
                let name = decode_name(fields[2])?;
                let size = decimal(fields[3], 0)?;
                let offer = Offer {
                    transfer_id: id,
                    file_name: name,
                    size,
                };
                offer.is_valid().then_some(Message::Offer(offer))
            }
            "14" => {
                if fields.len() != 3 || fields[2] != b"1".as_slice() {
                    return None;
                }
                Some(Message::Accept { transfer_id: id })
            }
            "16" => (fields.len() == 2).then_some(Message::Cancel { transfer_id: id }),
            "21" => (fields.len() == 2).then_some(Message::Acknowledgment { transfer_id: id }),
            _ => None,
        }
    }
}

/// Sự kiện transfer lên tầng UI.
#[derive(Clone, Debug, PartialEq)]
pub enum Event {
    /// Máy đối tác đề nghị gửi file (chưa chấp nhận).
    Offered { offer: Offer },
    /// Tiến độ: số byte đã chuyển / tổng.
    Progress {
        transfer_id: String,
        transferred: i64,
        size: i64,
    },
    /// Nhận xong file: toàn bộ byte (trình duyệt tự lưu xuống đĩa).
    Received {
        transfer_id: String,
        file_name: String,
        data: Vec<u8>,
    },
    /// Gửi xong file.
    Sent { transfer_id: String },
    Canceled { transfer_id: String },
    Failed {
        transfer_id: String,
        reason: String,
    },
}

struct Incoming {
    file_name: String,
    size: i64,
    data: Vec<u8>,
    /// Đã chấp nhận (bắt đầu nhận byte) hay chưa.
    accepted: bool,
}

struct Outgoing {
    data: Vec<u8>,
    size: i64,
    accepted: bool,
    /// Offset byte tiếp theo sẽ gửi (1-based).
    next_offset: i64,
    /// Tổng byte đã được máy kia ack.
    acknowledged: i64,
    /// Số byte của từng chunk đang bay (chưa ack).
    in_flight: Vec<i64>,
}

/// State machine transfer dùng chung cho cả 2 vai trò. Toàn bộ dữ liệu nằm
/// trong bộ nhớ wasm (trình duyệt không có file system) — hợp lệ cho tệp đính
/// kèm chat, không dùng cho file cỡ GB.
#[derive(Default)]
pub struct Engine {
    incoming: HashMap<String, Incoming>,
    outgoing: HashMap<String, Outgoing>,
}

impl Engine {
    pub fn count(&self) -> usize {
        self.incoming.len() + self.outgoing.len()
    }

    /// Đề nghị gửi file: trả về offer + các message cần gửi cho máy đối tác.
    pub fn offer(&mut self, file_name: &str, data: Vec<u8>) -> Result<(Offer, Vec<Message>)> {
        if self.count() >= MAX_TRANSFERS {
            return Err("Wait for another file transfer to finish.".into());
        }
        let size = data.len() as i64;
        let offer = Offer {
            transfer_id: new_transfer_id(),
            file_name: file_name.to_string(),
            size,
        };
        if !offer.is_valid() {
            return Err("The file name or size is not supported.".into());
        }
        self.outgoing.insert(
            offer.transfer_id.clone(),
            Outgoing {
                data,
                size,
                accepted: false,
                next_offset: 1,
                acknowledged: 0,
                in_flight: Vec::new(),
            },
        );
        Ok((offer.clone(), vec![Message::Offer(offer)]))
    }

    /// Chấp nhận nhận file từ máy đối tác. File rỗng hoàn thành ngay lập tức.
    pub fn accept(&mut self, transfer_id: &str) -> Result<(Vec<Message>, Vec<Event>)> {
        let (size, file_name) = {
            let Some(file) = self.incoming.get_mut(transfer_id) else {
                return Err("This file offer is no longer available.".into());
            };
            if file.accepted {
                return Ok((Vec::new(), Vec::new()));
            }
            file.accepted = true;
            (file.size, file.file_name.clone())
        };
        let id = transfer_id.to_string();
        let mut events = Vec::new();
        if size == 0 {
            let data = self
                .incoming
                .remove(transfer_id)
                .map(|f| f.data)
                .unwrap_or_default();
            events.push(Event::Received {
                transfer_id: id.clone(),
                file_name,
                data,
            });
        }
        Ok((vec![Message::Accept { transfer_id: id }], events))
    }

    /// Huỷ transfer ở 2 đầu.
    pub fn cancel(&mut self, transfer_id: &str) -> Vec<Message> {
        if self.incoming.remove(transfer_id).is_none()
            && self.outgoing.remove(transfer_id).is_none()
        {
            return Vec::new();
        }
        vec![Message::Cancel {
            transfer_id: transfer_id.to_string(),
        }]
    }

    /// Xử lý một message từ máy đối tác: trả về (message cần gửi lại, event).
    pub fn consume(&mut self, message: Message) -> (Vec<Message>, Vec<Event>) {
        match message {
            Message::Offer(offer) => {
                let id = offer.transfer_id.clone();
                if !offer.is_valid()
                    || self.incoming.contains_key(&id)
                    || self.outgoing.contains_key(&id)
                {
                    return (Vec::new(), Vec::new());
                }
                if self.count() >= MAX_TRANSFERS {
                    return (vec![Message::Cancel { transfer_id: id }], Vec::new());
                }
                let event = Event::Offered {
                    offer: offer.clone(),
                };
                self.incoming.insert(
                    id,
                    Incoming {
                        file_name: offer.file_name,
                        size: offer.size,
                        data: Vec::new(),
                        accepted: false,
                    },
                );
                (Vec::new(), vec![event])
            }
            Message::Accept { transfer_id } => {
                let size = {
                    let Some(file) = self.outgoing.get_mut(&transfer_id) else {
                        return (Vec::new(), Vec::new());
                    };
                    if file.accepted {
                        return (Vec::new(), Vec::new());
                    }
                    file.accepted = true;
                    file.size
                };
                if size == 0 {
                    self.outgoing.remove(&transfer_id);
                    return (
                        Vec::new(),
                        vec![Event::Sent {
                            transfer_id: transfer_id.clone(),
                        }],
                    );
                }
                let (messages, _) = self.fill_window(&transfer_id);
                (
                    messages,
                    vec![Event::Progress {
                        transfer_id,
                        transferred: 0,
                        size,
                    }],
                )
            }
            Message::Acknowledgment { transfer_id } => {
                let (acknowledged, size, done) = {
                    let Some(file) = self.outgoing.get_mut(&transfer_id) else {
                        return (Vec::new(), Vec::new());
                    };
                    if !file.accepted || file.in_flight.is_empty() {
                        return (Vec::new(), Vec::new());
                    }
                    file.acknowledged += file.in_flight.remove(0);
                    (file.acknowledged, file.size, file.acknowledged == file.size)
                };
                if done {
                    self.outgoing.remove(&transfer_id);
                    return (
                        Vec::new(),
                        vec![
                            Event::Progress {
                                transfer_id: transfer_id.clone(),
                                transferred: acknowledged,
                                size,
                            },
                            Event::Sent {
                                transfer_id: transfer_id.clone(),
                            },
                        ],
                    );
                }
                let (messages, _) = self.fill_window(&transfer_id);
                (
                    messages,
                    vec![Event::Progress {
                        transfer_id,
                        transferred: acknowledged,
                        size,
                    }],
                )
            }
            Message::Chunk {
                transfer_id,
                offset,
                data,
            } => {
                let outcome = {
                    let Some(file) = self.incoming.get_mut(&transfer_id) else {
                        return (Vec::new(), Vec::new());
                    };
                    if !file.accepted {
                        return (Vec::new(), Vec::new());
                    }
                    let received = file.data.len() as i64;
                    if offset != received + 1
                        || data.is_empty()
                        || data.len() > MAX_PART_SIZE
                        || data.len() as i64 > file.size - received
                    {
                        None
                    } else {
                        file.data.extend_from_slice(&data);
                        Some((file.data.len() as i64, file.size, file.file_name.clone()))
                    }
                };
                let Some((received, size, file_name)) = outcome else {
                    return self.fail(
                        &transfer_id,
                        "The file contained an invalid data offset or length.",
                    );
                };
                let mut events = vec![Event::Progress {
                    transfer_id: transfer_id.clone(),
                    transferred: received,
                    size,
                }];
                let messages = vec![Message::Acknowledgment {
                    transfer_id: transfer_id.clone(),
                }];
                if received == size {
                    let file = self
                        .incoming
                        .remove(&transfer_id)
                        .expect("transfer đang tồn tại");
                    events.push(Event::Received {
                        transfer_id,
                        file_name,
                        data: file.data,
                    });
                }
                (messages, events)
            }
            Message::Cancel { transfer_id } => {
                if self.incoming.remove(&transfer_id).is_none()
                    && self.outgoing.remove(&transfer_id).is_none()
                {
                    return (Vec::new(), Vec::new());
                }
                (
                    Vec::new(),
                    vec![Event::Canceled {
                        transfer_id: transfer_id.clone(),
                    }],
                )
            }
        }
    }

    pub fn fail(&mut self, transfer_id: &str, reason: &str) -> (Vec<Message>, Vec<Event>) {
        self.incoming.remove(transfer_id);
        self.outgoing.remove(transfer_id);
        (
            vec![Message::Cancel {
                transfer_id: transfer_id.to_string(),
            }],
            vec![Event::Failed {
                transfer_id: transfer_id.to_string(),
                reason: reason.to_string(),
            }],
        )
    }

    /// Xoá toàn bộ state (phiên đóng).
    pub fn reset(&mut self) {
        self.incoming.clear();
        self.outgoing.clear();
    }

    /// Đổ tiếp chunk cho đến khi đủ cửa sổ `PARTS_IN_FLIGHT`.
    fn fill_window(&mut self, transfer_id: &str) -> (Vec<Message>, Vec<Event>) {
        let mut messages = Vec::new();
        let mut truncated = false;
        {
            let Some(file) = self.outgoing.get_mut(transfer_id) else {
                return (Vec::new(), Vec::new());
            };
            if !file.accepted {
                return (Vec::new(), Vec::new());
            }
            while file.in_flight.len() < PARTS_IN_FLIGHT && file.next_offset <= file.size {
                let start = (file.next_offset - 1) as usize;
                let length =
                    (MAX_PART_SIZE as i64).min(file.size - file.next_offset + 1) as usize;
                if start + length > file.data.len() {
                    // Nguồn bị đổi/truncated — fail, không báo thành công giả.
                    truncated = true;
                    break;
                }
                messages.push(Message::Chunk {
                    transfer_id: transfer_id.to_string(),
                    offset: file.next_offset,
                    data: file.data[start..start + length].to_vec(),
                });
                file.next_offset += length as i64;
                file.in_flight.push(length as i64);
            }
        }
        if truncated {
            return self.fail(transfer_id, "The file could not be read.");
        }
        (messages, Vec::new())
    }
}

/// ID hợp lệ: 1..=64 ký tự [0-9A-Za-z_-].
fn valid_id(bytes: &[u8]) -> Option<String> {
    if bytes.is_empty()
        || bytes.len() > 64
        || !bytes.iter().all(|&b| {
            b.is_ascii_alphanumeric() || b == b'-' || b == b'_'
        })
    {
        return None;
    }
    String::from_utf8(bytes.to_vec()).ok()
}

fn valid_command(bytes: &[u8], command: u8) -> bool {
    bytes == [command] || bytes == [command, 0]
}

/// Tên file từ host: thử UTF-8 (bản MacViewer gửi UTF-8), chấp nhận ASCII.
fn decode_name(bytes: &[u8]) -> Option<String> {
    if bytes.len() > MAX_NAME_BYTES {
        return None;
    }
    std::str::from_utf8(bytes).ok().map(str::to_string)
}

/// Offset chunk: Double8 (bản mới) hoặc Int32LE dương (bản cũ).
fn chunk_offset(bytes: &[u8]) -> Option<i64> {
    if bytes.len() == 8 {
        return integer_double(bytes, 1);
    }
    if bytes.len() != 4 {
        return None;
    }
    let value = u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
    if value == 0 || value > i32::MAX as u32 {
        return None;
    }
    Some(value as i64)
}

/// Số nguyên dạng f64 little-endian 8 byte, đúng giới hạn và không có phần thập phân.
fn integer_double(bytes: &[u8], minimum: i64) -> Option<i64> {
    if bytes.len() != 8 {
        return None;
    }
    let bits = u64::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7]]);
    let value = f64::from_bits(bits);
    if !value.is_finite()
        || value < minimum as f64
        || value > MAX_FILE_SIZE as f64
        || value.trunc() != value
    {
        return None;
    }
    Some(value as i64)
}

fn double8(value: i64) -> [u8; 8] {
    (value as f64).to_bits().to_le_bytes()
}

/// Số thập phân ASCII (dùng ở chiều viewer → host).
fn decimal(bytes: &[u8], minimum: i64) -> Option<i64> {
    if bytes.is_empty() || bytes.len() > 16 || !bytes.iter().all(|b| b.is_ascii_digit()) {
        return None;
    }
    let text = std::str::from_utf8(bytes).ok()?;
    let value: i64 = text.parse().ok()?;
    (value >= minimum && value <= MAX_FILE_SIZE).then_some(value)
}

/// Tách đúng `fields` phần đầu theo "|||", phần cuối giữ nguyên toàn bộ.
fn split_header(bytes: &[u8], fields: usize) -> Vec<&[u8]> {
    let mut remainder = bytes;
    let mut result = Vec::with_capacity(fields + 1);
    for _ in 0..fields {
        let Some(pos) = find(remainder, b"|||") else {
            break;
        };
        result.push(&remainder[..pos]);
        remainder = &remainder[pos + 3..];
    }
    result.push(remainder);
    result
}

fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|w| w == needle)
}

fn viewer_text(text: &str) -> (Vec<u8>, bool) {
    (utf16le(text), true)
}

/// ID transfer: "3" + 19 chữ số (giống format bản gốc, tránh trùng ID máy kia).
fn new_transfer_id() -> String {
    format!("3{}", crate::wire::random_string(19, b"0123456789"))
}

#[cfg(test)]
mod tests {
    use super::*;

    // Tests/UltraViewerProtocolTests/FileTransferTests.swift
    #[test]
    fn offer_round_trip_both_directions() {
        let offer = Offer {
            transfer_id: "3123456789012345678".into(),
            file_name: "report.pdf".into(),
            size: 1234,
        };
        let (payload, flag) = offer.viewer_to_host();
        assert!(flag);
        assert_eq!(
            crate::wire::strict_utf16le(&payload).unwrap(),
            "13|||3123456789012345678|||report.pdf|||1234"
        );
        assert_eq!(
            Message::decode_viewer_payload(&payload),
            Some(Message::Offer(offer.clone()))
        );
        let host = offer.host_to_viewer();
        let parts = crate::wire::decode_multipart(&host).unwrap();
        assert_eq!(Message::decode_host_parts(&parts), Some(Message::Offer(offer)));
    }

    #[test]
    fn chunk_round_trip_with_raw_bytes() {
        let data = b"|||\x00\xff binary".to_vec();
        let message = Message::Chunk {
            transfer_id: "abc-1".into(),
            offset: 32001,
            data: data.clone(),
        };
        let (payload, flag) = message.viewer_encode();
        assert!(!flag);
        assert_eq!(Message::decode_viewer_payload(&payload), Some(message.clone()));
        let host = message.host_encode();
        let parts = crate::wire::decode_multipart(&host).unwrap();
        assert_eq!(Message::decode_host_parts(&parts), Some(message));
    }

    #[test]
    fn legacy_int32_offset_and_rejections() {
        let host = encode_multipart(&[
            &[15, 0],
            b"abc-1",
            &32001u32.to_le_bytes(),
            b"data",
        ]);
        let parts = crate::wire::decode_multipart(&host).unwrap();
        assert_eq!(
            Message::decode_host_parts(&parts),
            Some(Message::Chunk {
                transfer_id: "abc-1".into(),
                offset: 32001,
                data: b"data".to_vec(),
            })
        );
        // Offset 0 / resume không hợp lệ.
        let bad = encode_multipart(&[&[15, 0], b"abc-1", &0u32.to_le_bytes(), b"data"]);
        let parts = crate::wire::decode_multipart(&bad).unwrap();
        assert_eq!(Message::decode_host_parts(&parts), None);
        // Accept phải là offset 1.
        let bad = encode_multipart(&[&[14, 0], b"abc-1", &2u32.to_le_bytes()]);
        let parts = crate::wire::decode_multipart(&bad).unwrap();
        assert_eq!(Message::decode_host_parts(&parts), None);
        // ID xấu bị từ chối.
        let bad = encode_multipart(&[&[16, 0], b"bad id!"]);
        let parts = crate::wire::decode_multipart(&bad).unwrap();
        assert_eq!(Message::decode_host_parts(&parts), None);
        // Tên chứa "|||" không hợp lệ.
        assert!(!Offer {
            transfer_id: "abc".into(),
            file_name: "a|||b".into(),
            size: 1,
        }
        .is_valid());
    }

    #[test]
    fn engine_sends_then_receives_file() {
        // Máy A gửi file cho máy B: A dùng outgoing, B dùng incoming.
        let mut sender = Engine::default();
        let mut receiver = Engine::default();
        let content: Vec<u8> = (0..70_000u32).map(|i| (i % 251) as u8).collect();
        let (offer, mut messages) = sender.offer("data.bin", content.clone()).unwrap();
        assert_eq!(messages, vec![Message::Offer(offer.clone())]);

        // B nhận offer, chấp nhận.
        let (reply, events) = receiver.consume(messages.remove(0));
        assert!(reply.is_empty());
        assert_eq!(
            events,
            vec![Event::Offered {
                offer: offer.clone()
            }]
        );
        let mut messages = receiver.accept(&offer.transfer_id).unwrap().0;
        assert_eq!(
            messages,
            vec![Message::Accept {
                transfer_id: offer.transfer_id.clone()
            }]
        );

        // A nhận accept → bắt đầu đổ chunk (cửa sổ 2 chunk).
        let (mut messages, events) = sender.consume(messages.remove(0));
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].transfer_id(), offer.transfer_id.as_str());
        assert!(matches!(events[0], Event::Progress { .. }));

        // B nhận chunk theo đúng thứ tự → ack; A nhận ack → đổ chunk tiếp.
        // (Relay đảm bảo thứ tự; vòng lặp này mô phỏng đúng luồng đó.)
        let mut received_data: Option<Vec<u8>> = None;
        while !messages.is_empty() {
            let message = messages.remove(0);
            let (mut reply, events) = receiver.consume(message);
            for event in events {
                if let Event::Received { data, .. } = event {
                    received_data = Some(data);
                }
            }
            while !reply.is_empty() {
                let r = reply.remove(0);
                let (more, _) = sender.consume(r);
                messages.extend(more);
            }
        }
        // Hết: B đã nhận đủ 70_000 byte, state hai bên đều dọn sạch.
        assert_eq!(received_data, Some(content));
        assert!(receiver.incoming.is_empty());
        assert!(sender.outgoing.get(&offer.transfer_id).is_none());
    }

    #[test]
    fn engine_rejects_bad_offset_and_cancels() {
        let mut receiver = Engine::default();
        let offer = Offer {
            transfer_id: "t1".into(),
            file_name: "x.txt".into(),
            size: 10,
        };
        receiver.consume(Message::Offer(offer.clone()));
        receiver.accept("t1").unwrap();
        // Chunk offset sai (bỏ qua chunk 1) → fail + cancel.
        let (messages, events) = receiver.consume(Message::Chunk {
            transfer_id: "t1".into(),
            offset: 5,
            data: b"12345".to_vec(),
        });
        assert_eq!(
            messages,
            vec![Message::Cancel {
                transfer_id: "t1".into()
            }]
        );
        assert!(matches!(events[0], Event::Failed { .. }));
        assert!(receiver.incoming.is_empty());
    }

    #[test]
    fn empty_file_completes_immediately() {
        let mut sender = Engine::default();
        let mut receiver = Engine::default();
        let (offer, mut messages) = sender.offer("empty.txt", Vec::new()).unwrap();
        let (reply, _) = receiver.consume(messages.remove(0));
        assert!(reply.is_empty());
        let (mut messages, events) = receiver.accept(&offer.transfer_id).unwrap();
        assert_eq!(
            messages,
            vec![Message::Accept {
                transfer_id: offer.transfer_id.clone()
            }]
        );
        // File rỗng: accept xong là hoàn thành ngay, không chờ chunk nào.
        assert_eq!(
            events,
            vec![Event::Received {
                transfer_id: offer.transfer_id.clone(),
                file_name: "empty.txt".into(),
                data: Vec::new(),
            }]
        );
        let (_, events) = sender.consume(messages.remove(0));
        assert_eq!(
            events,
            vec![Event::Sent {
                transfer_id: offer.transfer_id.clone()
            }]
        );
    }
}
