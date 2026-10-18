/**
 * TMQRCodeWorker - Web Worker xử lý nặng cho 2 tool QR:
 *   1. `gen`  : dựng ma trận QR + encode PNG (OffscreenCanvas) → data URL
 *   2. `scan` : decode ảnh (ImageBitmap) + tiền xử lý pixel + jsQR, nhiều tỉ lệ,
 *               nhiều cách tiền xử lý và nhiều hướng xoay
 *
 * Worker KHÔNG có DOM: dùng `createImageBitmap` để decode ảnh, `OffscreenCanvas`
 * để vẽ/đọc pixel, `ImageData` để thao tác buffer RGBA. jsQR và core của thư
 * viện `qrcode` là JS thuần nên chạy được trong worker.
 *
 * Lưu ý: task được xếp vào 1 chuỗi promise để chạy TUẦN TỰ trong worker
 * (pool bên main thread giả định 1 worker chỉ chạy 1 task/lần).
 */

import jsQR from "jsqr";
import QRCore from "qrcode/lib/core/qrcode.js";
import QRRendererUtils from "qrcode/lib/renderer/utils.js";
import { QR_CONFIG } from "./TMQRCodeConfig.js";

/* ───────────────────────── canvas / bitmap helpers ───────────────────────── */

function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  // Fallback hiếm gặp (trình duyệt không có OffscreenCanvas)
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToBlob(canvas, type = "image/png", quality) {
  if (typeof canvas.convertToBlob === "function") {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function decodeBlobToBitmap(blob) {
  // `imageOrientation: from-image` để tôn trọng EXIF như thẻ <img> mặc định;
  // browser cũ không hỗ trợ option này thì thử lại không kèm option.
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch (error) {
    return await createImageBitmap(blob);
  }
}

function bytesToBase64(bytes) {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/* ───────────────────────────── sinh QR code ───────────────────────────── */

async function generateOneQRCode(text, options) {
  const qrData = QRCore.create(text, {
    errorCorrectionLevel: options.errorCorrectionLevel || "L",
  });
  // `getOptions` loại bỏ field thừa + quy đổi màu hex sang rgba,
  // giữ nguyên hành vi so với `qrcode.toDataURL` bản browser.
  const opts = QRRendererUtils.getOptions(options);
  const size = QRRendererUtils.getImageWidth(qrData.modules.size, opts);

  const imageData = new ImageData(size, size);
  QRRendererUtils.qrToImageData(imageData.data, qrData, opts);

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);

  const blob = await canvasToBlob(canvas, "image/png");
  const buffer = new Uint8Array(await blob.arrayBuffer());
  return `data:image/png;base64,${bytesToBase64(buffer)}`;
}

async function handleGenerate(message) {
  const { chunks = [], options = {} } = message.payload || {};
  const items = [];
  const errors = [];

  for (const chunk of chunks) {
    const index = typeof chunk.index === "number" ? chunk.index : items.length;
    try {
      const src = await generateOneQRCode(chunk.text, options);
      items.push({ index, src });
      // Báo về main thread ngay để UI hiển thị dần thay vì đợi hết
      postMessage({
        id: message.id,
        final: false,
        type: "gen-item",
        index,
        src,
      });
    } catch (error) {
      console.error("[TMQRCodeWorker] không tạo được QR:", error);
      errors.push({ index, error: String(error?.message || error) });
      postMessage({
        id: message.id,
        final: false,
        type: "gen-error",
        index,
        error: String(error?.message || error),
      });
    }
  }

  postMessage({
    id: message.id,
    final: true,
    ok: true,
    result: { items, errors },
  });
}

/* ─────────────────────────── tiền xử lý pixel ─────────────────────────── */

const NOISE_SCRATCH = new Uint8ClampedArray(9);

/** Median filter 3x3, dùng mảng tạm tái sử dụng để không cấp phát mỗi pixel. */
function applyNoiseReduction(data, width, height) {
  const out = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let n = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            NOISE_SCRATCH[n++] = data[((y + ky) * width + (x + kx)) * 4 + c];
          }
        }
        // insertion sort cho 9 phần tử
        for (let i = 1; i < 9; i++) {
          const v = NOISE_SCRATCH[i];
          let j = i - 1;
          while (j >= 0 && NOISE_SCRATCH[j] > v) {
            NOISE_SCRATCH[j + 1] = NOISE_SCRATCH[j];
            j--;
          }
          NOISE_SCRATCH[j + 1] = v;
        }
        out[(y * width + x) * 4 + c] = NOISE_SCRATCH[4];
      }
    }
  }
  data.set(out);
}

function applySharpenFilter(data, width, height) {
  const out = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const idx = (y * width + x) * 4 + c;
        out[idx] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  data.set(out);
}

function enhanceContrast(data) {
  const length = data.length;
  let minR = 255,
    maxR = 0,
    minG = 255,
    maxG = 0,
    minB = 255,
    maxB = 0;

  for (let i = 0; i < length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
    if (b < minB) minB = b;
    if (b > maxB) maxB = b;
  }

  const rangeR = maxR - minR || 1;
  const rangeG = maxG - minG || 1;
  const rangeB = maxB - minB || 1;

  for (let i = 0; i < length; i += 4) {
    data[i] = Math.round(((data[i] - minR) / rangeR) * 255);
    data[i + 1] = Math.round(((data[i + 1] - minG) / rangeG) * 255);
    data[i + 2] = Math.round(((data[i + 2] - minB) / rangeB) * 255);
  }
}

function applyAdaptiveBinarization(data) {
  const length = data.length;
  const histogram = new Uint32Array(256);
  for (let i = 0; i < length; i += 4) {
    const gray =
      (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
    histogram[gray < 0 ? 0 : gray > 255 ? 255 : gray]++;
  }

  const total = length / 4;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0,
    wB = 0,
    wF = 0,
    mB = 0,
    max = 0,
    between = 0,
    threshold1 = 0,
    threshold2 = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    between = wB * wF * (mB - mF) * (mB - mF);

    if (between >= max) {
      threshold1 = i;
      if (between > max) {
        threshold2 = i;
      }
      max = between;
    }
  }

  const threshold = (threshold1 + threshold2) / 2;
  for (let i = 0; i < length; i += 4) {
    const gray =
      (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
    const binary = gray > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binary;
  }
}

/**
 * Áp dụng chuỗi tiền xử lý trên buffer RGBA. Trả về buffer mới, không sửa buffer gốc
 * (jsQR cần dữ liệu sạch cho các attempt sau).
 */
function applyPreprocess(source, width, height, options) {
  let data = source;
  let owned = false;
  const ensureOwned = () => {
    if (!owned) {
      data = new Uint8ClampedArray(source);
      owned = true;
    }
    return data;
  };

  if (options.enableNoiseReduction)
    applyNoiseReduction(ensureOwned(), width, height);
  if (options.enableSharpening)
    applySharpenFilter(ensureOwned(), width, height);
  if (options.enableContrastEnhancement) enhanceContrast(ensureOwned());
  if (options.enableBinarization) applyAdaptiveBinarization(ensureOwned());
  return data;
}

/* ─────────────────────────── xoay ảnh (thuần JS) ─────────────────────────── */

/**
 * Xoay 90° theo chiều kim đồng hồ ghi vào `target` (tái sử dụng buffer để
 * giảm áp lực GC). Kích thước đổi: width <-> height.
 */
function rotateIntoClockwise(source, width, height, target) {
  for (let dy = 0; dy < width; dy++) {
    const srcRow = dy * width;
    const dstCol = dy;
    for (let dx = 0; dx < height; dx++) {
      const s = (srcRow + height - 1 - dx) * 4;
      const d = (dx * height + dstCol) * 4;
      target[d] = source[s];
      target[d + 1] = source[s + 1];
      target[d + 2] = source[s + 2];
      target[d + 3] = source[s + 3];
    }
  }
}

/* ───────────────────────────── quét QR ───────────────────────────── */

/**
 * Các kích thước sẽ thử, ĐÃ SẮP THEO THỨ TỰ ƯU TIÊN và đã loại trùng.
 *
 * Kích thước gốc đứng đầu: ảnh QR đã rõ (ảnh do tool này sinh ra, screenshot…)
 * thường đọc được ngay ở attempt đầu tiên, còn các tỉ lệ thu nhỏ chỉ là
 * fallback cho ảnh lớn mờ/nhiễu. Đảo thứ tự này là thay đổi có tác dụng lớn
 * nhất về tốc độ: jsQR chậm (~1.2 Mpx/s), mỗi lần thử lại tốn theo số pixel.
 */
function getMultipleScales(width, height) {
  const { maxWidth, maxHeight, minWidth, minHeight } = QR_CONFIG.canvasOptions;
  const scales = [];
  const seen = new Set();

  const push = (w, h) => {
    w = Math.max(1, Math.floor(w));
    h = Math.max(1, Math.floor(h));
    const key = `${w}x${h}`;
    if (seen.has(key)) return; // 2 tỉ lệ khác nhau vẫn có thể ra cùng kích thước
    seen.add(key);
    scales.push({ width: w, height: h });
  };

  const maxScale = Math.min(maxWidth / width, maxHeight / height);
  const minScale = Math.max(minWidth / width, minHeight / height);

  if (maxScale >= 1 && minScale <= 1) {
    push(width, height); // ảnh vừa khung → thử nguyên kích thước
  }
  [0.5, 0.4, 0.3].forEach((factor) => {
    const scale = Math.min(maxScale, factor);
    if (scale >= minScale && scale < 1) {
      push(width * scale, height * scale);
    }
  });

  if (scales.length === 0) {
    const scale = Math.min(maxScale, Math.max(minScale, 0.5));
    push(width * scale, height * scale);
  }
  return scales;
}

/**
 * Các bộ tiền xử lý, xếp từ rẻ → đắt.
 *
 * `inversionAttempt: attemptBoth` đã thử cả bản đảo màu, nên không cần thêm
 * attempt `onlyInvert` / `dontInvert` riêng cho ảnh gốc và ảnh đã tăng tương
 * phản (trước đây có, và chúng không thêm khả năng đọc nào mà tốn công).
 */
function buildScanAttempts() {
  const preprocessOptions = QR_CONFIG.preprocessOptions;
  const attempts = [
    {
      name: "original",
      preprocess: null,
      options: { inversionAttempt: "attemptBoth" },
    },
  ];

  if (preprocessOptions.enableContrastEnhancement) {
    attempts.push({
      name: "contrast",
      preprocess: { enableContrastEnhancement: true },
      options: { inversionAttempt: "attemptBoth" },
    });
  }

  if (preprocessOptions.enableSharpening) {
    attempts.push({
      name: "sharpen",
      preprocess: { enableSharpening: true },
      options: { inversionAttempt: "attemptBoth" },
    });
  }

  if (preprocessOptions.enableBinarization) {
    attempts.push(
      {
        name: "binary",
        preprocess: { enableBinarization: true },
        options: { inversionAttempt: "dontInvert" },
      },
      {
        name: "binary-invert",
        preprocess: { enableBinarization: true },
        options: { inversionAttempt: "onlyInvert" },
      },
    );
  }

  return attempts;
}

/**
 * Thử 1 danh sách attempt trên 1 bộ pixel đã resize.
 * @returns {Promise<string|null>}
 */
async function scanImageData(original, attempts) {
  const { data, width, height } = original;
  for (const attempt of attempts) {
    try {
      const processed = attempt.preprocess
        ? applyPreprocess(data, width, height, attempt.preprocess)
        : data;

      const code = jsQR(processed, width, height, attempt.options);
      if (code && code.data) {
        return code.data;
      }
    } catch (error) {
      console.warn(
        `[TMQRCodeWorker] jsQR attempt "${attempt.name}" lỗi:`,
        error,
      );
    }
  }
  return null;
}

/**
 * Quét 1 bitmap, trả về chuỗi dữ liệu QR đầu tiên tìm được hoặc null.
 */
async function scanBitmap(bitmap) {
  const scales = getMultipleScales(bitmap.width, bitmap.height);
  const attempts = buildScanAttempts();

  for (const scale of scales) {
    const canvas = createCanvas(scale.width, scale.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, scale.width, scale.height);
    const original = ctx.getImageData(0, 0, scale.width, scale.height);

    const found = await scanImageData(original, attempts);
    if (found) {
      return found;
    }
  }

  // Fallback cuối: xoay ảnh đầu tiên 90°/270°.
  // jsQR vốn bất biến với phép xoay bội của 90° nên bước này hiếm khi cần,
  // giữ lại để phòng ảnh méo/bị cắt lệch. Bỏ 180° vì = 2 lần xoay 90°.
  if (QR_CONFIG.preprocessOptions.enableRotationCorrection) {
    const first = scales[0];
    const canvas = createCanvas(first.width, first.height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, first.width, first.height);
    const original = ctx.getImageData(0, 0, first.width, first.height);

    const rotated = new Uint8ClampedArray(original.data.length);
    for (let times = 1; times <= 2; times++) {
      rotateIntoClockwise(original.data, first.width, first.height, rotated);
      const found = await scanImageData(
        { data: rotated, width: first.height, height: first.width },
        [attempts[0]],
      );
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/* ─────────────── cắt ảnh nhiều QR bằng khoảng trắng (quiet zone) ─────────────── */

function findGaps(sums, length, maxNoise) {
  const gaps = [];
  let inGap = true;
  let gapStart = 0;

  for (let i = 0; i < length; i++) {
    if (sums[i] <= maxNoise) {
      if (!inGap) {
        inGap = true;
        gapStart = i;
      }
    } else if (inGap) {
      inGap = false;
      if (i - gapStart >= Math.max(3, Math.floor(length * 0.005))) {
        gaps.push({
          start: gapStart,
          end: i - 1,
          center: Math.floor((gapStart + i - 1) / 2),
        });
      }
    }
  }
  if (inGap) {
    gaps.push({
      start: gapStart,
      end: length - 1,
      center: Math.floor((gapStart + length - 1) / 2),
    });
  }
  return gaps;
}

/**
 * Cắt 1 ảnh thành nhiều ảnh con theo khoảng trắng giữa các QR.
 * @returns {Promise<Array<{blob: Blob}>>}
 */
async function sliceImageByQuietZones(blob) {
  const img = await decodeBlobToBitmap(blob);
  try {
    const width = img.width;
    const height = img.height;
    if (width < 50 || height < 50) {
      return [blob];
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;

    const colSums = new Int32Array(width);
    const rowSums = new Int32Array(height);
    const threshold = 200;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] < 128) continue; // bỏ qua pixel trong suốt
        const gray =
          0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (gray < threshold) {
          colSums[x]++;
          rowSums[y]++;
        }
      }
    }

    const maxNoiseCol = Math.max(1, Math.floor(height * 0.005));
    const maxNoiseRow = Math.max(1, Math.floor(width * 0.005));

    const colGaps = findGaps(colSums, width, maxNoiseCol);
    const rowGaps = findGaps(rowSums, height, maxNoiseRow);

    if (colGaps.length === 0 || colGaps[0].start > 0)
      colGaps.unshift({ center: 0 });
    if (colGaps[colGaps.length - 1].end < width - 1)
      colGaps.push({ center: width });
    if (rowGaps.length === 0 || rowGaps[0].start > 0)
      rowGaps.unshift({ center: 0 });
    if (rowGaps[rowGaps.length - 1].end < height - 1)
      rowGaps.push({ center: height });

    const extracted = [];

    for (let r = 0; r < rowGaps.length - 1; r++) {
      const y1 = rowGaps[r].center;
      const y2 = rowGaps[r + 1].center;
      const regionHeight = y2 - y1;

      for (let c = 0; c < colGaps.length - 1; c++) {
        const x1 = colGaps[c].center;
        const x2 = colGaps[c + 1].center;
        const regionWidth = x2 - x1;
        if (regionWidth <= 50 || regionHeight <= 50) continue;

        let hasContent = false;
        for (let x = x1; x < x2 && !hasContent; x++) {
          if (colSums[x] > maxNoiseCol) hasContent = true;
        }
        if (!hasContent) continue;

        const subCanvas = createCanvas(regionWidth, regionHeight);
        const subCtx = subCanvas.getContext("2d", { willReadFrequently: true });
        subCtx.fillStyle = "#ffffff"; // nền trắng phòng ảnh nền trong suốt
        subCtx.fillRect(0, 0, regionWidth, regionHeight);
        subCtx.drawImage(
          img,
          x1,
          y1,
          regionWidth,
          regionHeight,
          0,
          0,
          regionWidth,
          regionHeight,
        );
        extracted.push({
          index: r * 1000 + c,
          blob: await canvasToBlob(subCanvas, blob.type || "image/png"),
        });
      }
    }

    return extracted.length > 0 ? extracted : [{ index: 0, blob }];
  } finally {
    if (typeof img.close === "function") img.close();
  }
}

/**
 * Quét 1 file: cắt thành nhiều phần (nếu bật multi QR) rồi đọc từng phần.
 * Phần nào jsQR không đọc được sẽ trả kèm blob để main thread chạy fallback
 * (QrScanner/ZXing cần DOM nên không chạy được trong worker).
 */
async function scanOneFile(file, scanMultiple) {
  const parts = scanMultiple
    ? await sliceImageByQuietZones(file.blob)
    : [{ index: 0, blob: file.blob }];

  const results = [];
  for (const part of parts) {
    let text = null;
    let blob = part.blob;
    try {
      const bitmap = await decodeBlobToBitmap(blob);
      try {
        text = await scanBitmap(bitmap);
      } finally {
        if (typeof bitmap.close === "function") bitmap.close();
      }
    } catch (error) {
      console.warn("[TMQRCodeWorker] không đọc được ảnh:", error);
    }

    const decoded = text && String(text).trim() ? String(text).trim() : null;
    results.push({
      index: results.length,
      text: decoded,
      // chỉ trả blob khi cần fallback → nhẹ hơn cho ảnh đọc được ngay
      fallback: decoded
        ? null
        : { blob, name: file.name, type: blob.type || file.type },
    });
  }
  return results;
}

async function handleScan(message) {
  const { files = [], scanMultiple = true } = message.payload || {};
  const results = [];

  for (const file of files) {
    let parts = [];
    let error = null;
    try {
      parts = await scanOneFile(file, scanMultiple);
    } catch (err) {
      error = String(err?.message || err);
      parts = [
        {
          index: 0,
          text: null,
          fallback: { blob: file.blob, name: file.name, type: file.type },
        },
      ];
    }
    results.push({ fileName: file.name, parts, error });
    postMessage({
      id: message.id,
      final: false,
      type: "scan-progress",
      fileName: file.name,
      done: results.length,
      total: files.length,
    });
  }

  postMessage({ id: message.id, final: true, ok: true, result: { results } });
}

/* ───────────────────────────── điều phối message ───────────────────────────── */

async function dispatchTask(message) {
  switch (message.type) {
    case "gen":
      return handleGenerate(message);
    case "scan":
      return handleScan(message);
    default:
      throw new Error(`TMQRCodeWorker: task không hợp lệ "${message.type}"`);
  }
}

let taskChain = Promise.resolve();

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message) return;
  // Xếp chuỗi để task trong cùng worker chạy tuần tự, tránh nhiều tác vụ
  // nặng cùng lúc làm tăng bộ nhớ và chậm tất cả.
  taskChain = taskChain.then(() =>
    dispatchTask(message).catch((error) => {
      console.error("[TMQRCodeWorker] task lỗi:", error);
      postMessage({
        id: message.id,
        final: true,
        ok: false,
        error: String(error?.message || error),
      });
    }),
  );
});
