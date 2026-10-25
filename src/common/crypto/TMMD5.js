/**
 * TMMD5 — tính MD5 dùng chung cho toàn app.
 *
 * Vì sao không dùng Web Crypto? `crypto.subtle` không hỗ trợ MD5. File này tự
 * cài đặt MD5 bằng JS thuần để:
 *   - chạy được trong **Web Worker classic** (cimbar dùng `importScripts`);
 *   - chạy được ở main thread mà không cần thư viện ngoài.
 *
 * Cách dùng:
 *   - Trong Web Worker classic (hoặc script thường):
 *       importScripts(urlCuaFileNay);
 *       const hex = self.TMMD5.md5Hex(uint8Array);
 *
 *   - Trong module ES (main thread, tool khác):
 *       import "@/common/crypto/TMMD5.js"; // chỉ chạy side-effect
 *       const hex = globalThis.TMMD5.md5Hex(uint8Array);
 *
 *   - Lấy URL để truyền vào worker:
 *       import md5Url from "@/common/crypto/TMMD5.js?url";
 *
 * Lưu ý: file cố tình **không dùng** `import`/`export` để `importScripts()`
 * đọc được. Đừng thêm cú pháp ESM vào đây.
 *
 * MD5 chỉ dùng để đối chiếu/kiểm tra toàn vẹn dữ liệu, KHÔNG dùng cho bảo mật.
 */
(function (root, factory) {
  "use strict";

  var api = factory();
  root.TMMD5 = api;

  // Cho phép dùng ở môi trường CommonJS (test bằng Node).
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Bảng dịch trái chuẩn của MD5.
  var SHIFT = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];

  // K[i] = floor(abs(sin(i + 1)) * 2^32)
  var K = new Int32Array(64);
  for (var i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  }

  function toHex(value) {
    var out = "";
    for (var i = 0; i < 4; i++) {
      out += ((value >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    }
    return out;
  }

  /**
   * MD5 của Uint8Array/ArrayBuffer.
   * @param {Uint8Array|ArrayBuffer} input
   * @returns {string} 32 ký tự hex thường
   */
  function md5Hex(input) {
    var bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    var length = bytes.length;
    // Số byte sau khi pad: (len + 1 + 8) làm tròn lên bội số 64.
    var paddedLength = (((length + 8) >>> 6) + 1) << 6;
    var buffer = new Uint8Array(paddedLength);
    buffer.set(bytes);
    buffer[length] = 0x80;

    var view = new DataView(buffer.buffer);
    var bitLength = length * 8;
    view.setUint32(paddedLength - 8, bitLength >>> 0, true);
    view.setUint32(paddedLength - 4, Math.floor(bitLength / 4294967296), true);

    var a0 = 0x67452301;
    var b0 = 0xefcdab89;
    var c0 = 0x98badcfe;
    var d0 = 0x10325476;
    var words = new Int32Array(16);

    for (var offset = 0; offset < paddedLength; offset += 64) {
      for (var j = 0; j < 16; j++) {
        words[j] = view.getInt32(offset + j * 4, true);
      }

      var a = a0;
      var b = b0;
      var c = c0;
      var d = d0;

      for (var k = 0; k < 64; k++) {
        var f;
        var g;
        if (k < 16) {
          f = (b & c) | (~b & d);
          g = k;
        } else if (k < 32) {
          f = (d & b) | (~d & c);
          g = (5 * k + 1) & 15;
        } else if (k < 48) {
          f = b ^ c ^ d;
          g = (3 * k + 5) & 15;
        } else {
          f = c ^ (b | ~d);
          g = (7 * k) & 15;
        }
        f = (f + a + K[k] + words[g]) | 0;
        a = d;
        d = c;
        c = b;
        var shift = SHIFT[k];
        b = (b + ((f << shift) | (f >>> (32 - shift)))) | 0;
      }

      a0 = (a0 + a) | 0;
      b0 = (b0 + b) | 0;
      c0 = (c0 + c) | 0;
      d0 = (d0 + d) | 0;
    }

    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
  }

  /**
   * MD5 của chuỗi UTF-8.
   * @param {string} text
   * @returns {string} 32 ký tự hex thường
   */
  function md5HexOfText(text) {
    return md5Hex(
      new TextEncoder().encode(String(text == null ? "" : text)),
    );
  }

  return {
    md5Hex: md5Hex,
    md5HexOfText: md5HexOfText,
  };
});
