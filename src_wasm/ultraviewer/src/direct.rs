//! Hỗ trợ đường LAN trực tiếp của UltraViewer.
//!
//! Khi 2 máy cùng mạng LAN, client gốc của UltraViewer để máy đối tác tự
//! kết nối thẳng vào listener của máy viewer, nhờ vậy màn hình không phải đi
//! vòng qua relay công cộng (độ trễ thấp hơn nhiều và nội dung không rời LAN).
//!
//! Cơ chế (xem `LinuxViewer/src/direct.rs` của MacViewer):
//!   1. Viewer mở listener TCP trên IP LAN của nó.
//!   2. Viewer gửi kèm "direct details" trong lệnh tra cứu máy đối tác:
//!      "IPRelay|PortRelay|IPLAN|PortLAN|key".
//!   3. Máy đối tác đọc thông tin đó và tự kết nối vào listener.
//!
//! Module này chỉ lo phần *quyết định* dùng đường trực tiếp hay không; phần
//! socket và mã hoá do daemon (Go) đảm nhiện nên trình duyệt không cần biết.

// ---------------------------------------------------------------------------
// Port từ MacViewer (https://github.com/DeanOpen/MacViewer) — giấy phép MIT,
// Copyright (c) 2026 MacViewer contributors. Xem LICENSE-MacViewer.
// ---------------------------------------------------------------------------

use crate::wire::Ipv4;

/// Thông tin listener LAN do daemon báo (IP, cổng và khoá phiên).
#[derive(Clone, Debug, PartialEq)]
pub struct DirectListener {
    /// Địa chỉ LAN của máy chạy daemon.
    pub ip: String,
    /// Cổng đang lắng nghe.
    pub port: u16,
    /// Khoá phiên (14 ký tự) dùng mã hoá kênh trực tiếp.
    pub key: String,
}

/// `is_lan_address`: địa chỉ nằm trong mạng riêng (10/8, 172.16/12, 192.168/16,
/// 169.254/16).
pub fn is_lan_address(a: Ipv4) -> bool {
    let b = a.0;
    b[0] == 10
        || (b[0] == 172 && (16..=31).contains(&b[1]))
        || (b[0] == 192 && b[1] == 168)
        || (b[0] == 169 && b[1] == 254)
}

/// `peer_lan_address`: suy ra địa chỉ LAN của máy đối tác.
///
/// Chỉ dùng được khi 2 máy có cùng địa chỉ public (cùng mạng NAT) — nếu khác
/// thì chắc chắn không cùng LAN và phải dùng relay. Địa chỉ lấy từ trường
/// "direct details" của máy đối tác ("ip|port"), nếu không có thì dùng trường
/// "lan ip" trong lệnh tra cứu.
pub fn peer_lan_address(
    public_address: Ipv4,
    own_public: Ipv4,
    details: Option<&str>,
    fallback: &str,
) -> Option<Ipv4> {
    if public_address != own_public {
        return None;
    }
    let address = match details.filter(|d| !d.is_empty()) {
        Some(d) => {
            if d.len() > 64 {
                return None;
            }
            let f: Vec<&str> = d.split('|').collect();
            if f.len() != 2 || !f[1].bytes().all(|b| b.is_ascii_digit()) || f[1].parse::<u16>().ok()? == 0 {
                return None;
            }
            Ipv4::parse(f[0]).ok()?
        }
        None => Ipv4::parse(fallback).ok()?,
    };
    is_lan_address(address).then_some(address)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ip(text: &str) -> Ipv4 {
        Ipv4::parse(text).unwrap()
    }

    #[test]
    fn lan_addresses_are_private_ranges() {
        assert!(is_lan_address(ip("192.168.1.10")));
        assert!(is_lan_address(ip("10.0.0.5")));
        assert!(is_lan_address(ip("172.16.4.4")));
        assert!(is_lan_address(ip("172.31.255.1")));
        assert!(is_lan_address(ip("169.254.1.1")));
        assert!(!is_lan_address(ip("8.8.8.8")));
        assert!(!is_lan_address(ip("172.15.0.1")));
        assert!(!is_lan_address(ip("172.32.0.1")));
        assert!(!is_lan_address(ip("203.0.113.7")));
    }

    #[test]
    fn peer_lan_requires_same_public_address() {
        let own = ip("203.0.113.7");
        // Khác địa chỉ public → không cùng LAN.
        assert_eq!(
            peer_lan_address(ip("198.51.100.9"), own, Some("192.168.1.20|5555"), "192.168.1.9"),
            None
        );
        // Cùng địa chỉ public → lấy từ direct details.
        assert_eq!(
            peer_lan_address(ip("203.0.113.7"), own, Some("192.168.1.20|5555"), "192.168.1.9"),
            Some(ip("192.168.1.20"))
        );
        // Không có direct details → dùng trường lan ip.
        assert_eq!(
            peer_lan_address(ip("203.0.113.7"), own, None, "192.168.1.9"),
            Some(ip("192.168.1.9"))
        );
        // Direct details sai định dạng → bỏ qua.
        assert_eq!(
            peer_lan_address(ip("203.0.113.7"), own, Some("192.168.1.20"), "192.168.1.9"),
            None
        );
        // Địa chỉ không phải mạng riêng → không dùng đường trực tiếp.
        assert_eq!(
            peer_lan_address(ip("203.0.113.7"), own, Some("8.8.8.8|5555"), "192.168.1.9"),
            None
        );
    }
}
