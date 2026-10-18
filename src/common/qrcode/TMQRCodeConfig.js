/**
 * Cấu hình dùng chung cho pipeline đọc QR giữa main thread và Web Worker.
 *
 * File này KHÔNG import gì nặng để main thread import thoải mái (chỉ dùng để
 * lọc định dạng file hỗ trợ trước khi gửi sang worker).
 */
export const QR_CONFIG = {
  // Option truyền cho QrScanner (chỉ dùng ở fallback main thread)
  qrScannerOptions: {
    returnDetailedScanResult: true,
    highlightScanRegion: false,
    highlightCodeOutline: false,
    preferredCamera: "environment",
    maxScansPerSecond: 5,
  },

  // Giới hạn kích thước canvas khi quét để giới hạn chi phí CPU.
  // jsQR chạy ~1.2 Mpx/s, nên 1600px (2.56 Mpx, ~2s/lần thử) là mức hợp lý:
  // ảnh to hơn sẽ bị thu nhỏ về mức này rồi mới thử tiếp các tỉ lệ nhỏ hơn.
  canvasOptions: {
    maxWidth: 1600,
    maxHeight: 1600,
    minWidth: 200,
    minHeight: 200,
    quality: 1.0,
  },

  // Các bước tiền xử lý ảnh trước khi đưa cho jsQR
  preprocessOptions: {
    enableSharpening: true,
    enableNoiseReduction: true,
    enableContrastEnhancement: true,
    enableBinarization: true,
    enableRotationCorrection: true,
  },

  supportedFormats: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/gif",
  ],

  retryOptions: {
    maxRetries: 0,
    retryDelay: 0,
  },
};

export default QR_CONFIG;
