//! ZstdScreenDecoder.swift: bounded streaming zstd for uvc.dll ordinal 16.
//! Call reset before each drawing mission (ordinal 25); the dictionary survives.
//!
//! Port từ MacViewer/LinuxViewer (MIT). Bản gốc dùng `zstd-safe` (bọc thư viện
//! C zstd) — bản này dùng `ruzstd` (Rust thuần) vì thư viện C không link được
//! vào module wasm32-unknown-unknown: các hàm `ZSTD_*` sẽ thành import từ
//! module "env" mà trình duyệt không có, khiến module wasm không instantiate
//! được (tool không kết nối được).

use ruzstd::decoding::{BlockDecodingStrategy, Dictionary, FrameDecoder};

/// The trained dictionary the Windows desktop loads (UltraViewerScreenDictionary).
/// SHA-256: 9aa45789d9ff9d329a623a685d57b67e33c777019de9ce1f273f21860e4bfe6b
pub static SCREEN_DICTIONARY: &[u8] = include_bytes!("../../resources/8bit.dat");

/// Window tối đa cho phép (tương đương `DParameter::WindowLogMax(27)`):
/// header của uvc.dll chặn cửa sổ lớn hơn 0x8000000 byte.
const MAX_WINDOW_SIZE: u64 = 1 << 27;

#[derive(Clone, Debug, PartialEq)]
pub enum ZstdError {
    AllocationFailed,
    InvalidData(String),
    OutputLimitExceeded,
    IncompleteFrame,
    ResetRequired,
}

impl std::fmt::Display for ZstdError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "zstd: {self:?}")
    }
}

impl std::error::Error for ZstdError {}

/// Bộ giải nén zstd có giới hạn dung lượng, giữ từ điển giữa các lần gọi.
pub struct ZstdDecoder {
    decoder: FrameDecoder,
    pub max_output: usize,
    started: bool,
    incomplete: bool,
    failed: bool,
}

impl ZstdDecoder {
    pub fn new(max_output: usize, dictionary: Option<&[u8]>) -> Result<Self, ZstdError> {
        assert!(max_output > 0);
        let mut decoder = FrameDecoder::new();
        decoder.set_max_window_size(MAX_WINDOW_SIZE);
        if let Some(d) = dictionary {
            // Từ điển phải đúng định dạng zstd (magic 0xEC30A437) thì mới nạp
            // được; ID của từ điển phải khớp dictID trong header của khung hình.
            let dict = Dictionary::decode_dict(d).map_err(|e| ZstdError::InvalidData(e.to_string()))?;
            decoder.add_dict(dict).map_err(|e| ZstdError::InvalidData(e.to_string()))?;
        }
        Ok(ZstdDecoder { decoder, max_output, started: false, incomplete: false, failed: false })
    }

    /// Khung hình cuối cùng chưa giải mã trọn vẹn.
    pub fn has_incomplete_frame(&self) -> bool {
        self.incomplete
    }

    /// Reset phiên giải mã; từ điển đã nạp vẫn còn.
    pub fn reset(&mut self) -> Result<(), ZstdError> {
        self.started = false;
        self.incomplete = false;
        self.failed = false;
        Ok(())
    }

    /// Giải nén `compressed` (có thể gồm nhiều khung nối tiếp nhau).
    pub fn append(&mut self, compressed: &[u8]) -> Result<Vec<u8>, ZstdError> {
        if self.failed {
            return Err(ZstdError::ResetRequired);
        }
        let result = self.append_inner(compressed);
        if result.is_err() {
            self.failed = true;
        }
        result
    }

    fn append_inner(&mut self, compressed: &[u8]) -> Result<Vec<u8>, ZstdError> {
        let mut out: Vec<u8> = Vec::new();
        let mut input = compressed;
        while !input.is_empty() {
            // `init` đọc header khung hình và tự tra cứu từ điển theo dictID.
            self.decoder.init(&mut input).map_err(|e| ZstdError::InvalidData(e.to_string()))?;
            self.started = true;
            loop {
                self.decoder
                    .decode_blocks(&mut input, BlockDecodingStrategy::All)
                    .map_err(|e| {
                        // Hết dữ liệu giữa chừng = khung hình bị cắt cụt.
                        self.incomplete = true;
                        ZstdError::InvalidData(e.to_string())
                    })?;
                while self.decoder.can_collect() > 0 {
                    let chunk = self
                        .decoder
                        .collect()
                        .ok_or_else(|| ZstdError::InvalidData("collect failed".into()))?;
                    if out.len() + chunk.len() > self.max_output {
                        return Err(ZstdError::OutputLimitExceeded);
                    }
                    out.extend_from_slice(&chunk);
                }
                if self.decoder.is_finished() {
                    break;
                }
            }
        }
        self.incomplete = false;
        Ok(out)
    }

    /// Gọi ở cuối mỗi khung hình nén độc lập.
    pub fn finish(&self) -> Result<(), ZstdError> {
        if self.failed {
            return Err(ZstdError::ResetRequired);
        }
        if self.has_incomplete_frame() {
            return Err(ZstdError::IncompleteFrame);
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::Engine;

    // Independent zstd CLI -3 --no-check output.
    const FIXTURE: &[u8] = &[
        0x28, 0xb5, 0x2f, 0xfd, 0x00, 0x58, 0x0d, 0x01, 0x00, 0xc8, 0x4d, 0x61,
        0x63, 0x56, 0x69, 0x65, 0x77, 0x65, 0x72, 0x20, 0x73, 0x63, 0x72, 0x65,
        0x65, 0x6e, 0x20, 0x66, 0x69, 0x78, 0x74, 0x75, 0x72, 0x65, 0x0a, 0x01,
        0x00, 0xa1, 0x86, 0xfd, 0x39, 0x06,
    ];
    const MAX: usize = 128 << 20;

    #[test]
    fn fixture_decodes_to_expected_text() {
        let expected = "MacViewer screen fixture\n".repeat(100).into_bytes();
        let mut d = ZstdDecoder::new(MAX, None).unwrap();
        let out = d.append(FIXTURE).unwrap();
        assert_eq!(out, expected);
        d.finish().unwrap();
        assert!(!d.has_incomplete_frame());
    }

    #[test]
    fn truncation_and_limits() {
        let mut t = ZstdDecoder::new(MAX, None).unwrap();
        // Khung hình bị cắt cụt → báo lỗi, không trả dữ liệu sai.
        assert!(t.append(&FIXTURE[..FIXTURE.len() - 1]).is_err());
        assert!(t.has_incomplete_frame());
        t.reset().unwrap();

        let mut b = ZstdDecoder::new(100, None).unwrap();
        assert_eq!(b.append(FIXTURE), Err(ZstdError::OutputLimitExceeded));
        assert_eq!(b.append(&[1]), Err(ZstdError::ResetRequired));
        b.reset().unwrap();
        let raw = [0x28, 0xb5, 0x2f, 0xfd, 0x20, 0x03, 0x19, 0, 0, 65, 66, 67];
        assert_eq!(b.append(&raw).unwrap(), b"ABC");
        b.finish().unwrap();
    }

    #[test]
    fn concatenated_frames_and_corruption() {
        let mut d = ZstdDecoder::new(6000, None).unwrap();
        assert_eq!(d.append(&[FIXTURE, FIXTURE].concat()).unwrap().len(), 5000);
        d.finish().unwrap();
        d.reset().unwrap();
        assert!(d.append(b"invalid compressed frame").is_err());
    }

    #[test]
    fn trained_dictionary_survives_mission_reset() {
        let compressed = base64::engine::general_purpose::STANDARD
            .decode("KLUv/QdYEL2gPS0BAOhNYWNWaWV3ZXIgZGljdGlvbmFyeSBmaXh0dXJlCgEA0Qz4ygnbOEGJ").unwrap();
        let expected = "MacViewer dictionary fixture\n".repeat(100).into_bytes();
        // Không nạp từ điển thì khung hình yêu cầu dictID phải báo lỗi.
        let mut missing = ZstdDecoder::new(MAX, None).unwrap();
        assert!(missing.append(&compressed).is_err());
        assert_eq!(SCREEN_DICTIONARY.len(), 112_640);
        // Nạp từ điển thì giải mã được, và từ điển vẫn còn sau khi reset.
        let mut d = ZstdDecoder::new(MAX, Some(SCREEN_DICTIONARY)).unwrap();
        for _ in 0..2 {
            let out = d.append(&compressed).unwrap();
            assert_eq!(out, expected);
            d.finish().unwrap();
            d.reset().unwrap();
        }
    }
}
