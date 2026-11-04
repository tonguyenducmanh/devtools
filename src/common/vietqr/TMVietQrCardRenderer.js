/**
 * Renderer ảnh thẻ VietQR chuẩn nhận diện Napas247 — port từ QrImageService
 * (SkiaSharp) của vietqr-core (Ngochiendev, MIT) sang Canvas 2D + SVG string.
 *
 * 3 mẫu (khớp docs/image của vietqr-core):
 * - compact: thẻ 540x540 — header logo VietQR, khung viền xanh 374px, QR ECC Q,
 *   icon tâm, footer "napas247 | logo ngân hàng"
 * - qr_only: vuông tối giản, chỉ QR + icon tâm
 * - print: 600 x động — như compact + dòng Số tiền / Nội dung CK / Tên chủ TK /
 *   Số TK (đậm) / tên ngân hàng
 *
 * 4 định dạng: png, jpeg, webp (canvas) và svg (vector, logo nhúng base64).
 */
import QRCode from "qrcode";
import vietqrLogoUrl from "@/assets/vietqr/brand/vietqr.png";
import vietqrIconUrl from "@/assets/vietqr/brand/vietqr_icon.png";
import napasLogoUrl from "@/assets/vietqr/brand/napas247.png";

const NAVY = "#003b70";
const BANK_BLUE = "#00529b";

// Logo ngân hàng theo BIN, nạp toàn bộ bằng glob để Vite đóng gói asset hash
const logoModules = import.meta.glob("../../assets/vietqr/logos/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
export const bankLogoUrls = {};
for (const [path, url] of Object.entries(logoModules)) {
  const bin = path.match(/(\d+)\.png$/)?.[1];
  if (bin) {
    bankLogoUrls[bin] = url;
  }
}

const imageCache = new Map();
function loadImage(url) {
  if (!imageCache.has(url)) {
    imageCache.set(
      url,
      new Promise((resolvePromise, reject) => {
        const img = new Image();
        img.onload = () => resolvePromise(img);
        img.onerror = () => {
          imageCache.delete(url);
          reject(new Error(`Không tải được ảnh: ${url}`));
        };
        img.src = url;
      }),
    );
  }
  return imageCache.get(url);
}

const dataUrlCache = new Map();
async function toDataUrl(url) {
  if (!url || url.startsWith("data:")) {
    return url;
  }
  if (!dataUrlCache.has(url)) {
    dataUrlCache.set(
      url,
      (async () => {
        const blob = await (await fetch(url)).blob();
        return new Promise((resolvePromise) => {
          const reader = new FileReader();
          reader.onload = () => resolvePromise(reader.result);
          reader.readAsDataURL(blob);
        });
      })(),
    );
  }
  return dataUrlCache.get(url);
}

/**
 * Tìm vùng có nội dung thật của ảnh (bỏ lề trắng/trong suốt) và tâm đứng
 * có trọng số — port GetVisualBounds của vietqr-core, dùng để căn chân logo
 * footer cho thẳng hàng dù ảnh logo có nhiều khoảng trắng.
 */
function getVisualBounds(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let weightedY = 0;
  let totalWeight = 0;
  let found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const isBackground = a <= 15 || (r >= 248 && g >= 248 && b >= 248);
      if (!isBackground) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        weightedY += y;
        totalWeight++;
        found = true;
      }
    }
  }
  if (!found) {
    return { x: 0, y: 0, w: width, h: height, centerY: height / 2 };
  }
  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
    centerY: totalWeight > 0 ? weightedY / totalWeight : (minY + maxY) / 2,
  };
}

function createQrMatrix(payload) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "Q" });
  return { size: qr.modules.size, data: qr.modules.data };
}

function formatAmountVnd(amount) {
  const digits = String(amount).replace(/\D/g, "");
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped} VND`;
}

function buildPrintLines({ amount, description, accountNumber, accountName, bankFullName, isCard }) {
  const lines = [];
  if (amount > 0) {
    lines.push({ text: `Số tiền: ${formatAmountVnd(amount)}`, bold: false, size: 16 });
  }
  if (description && description.trim()) {
    lines.push({ text: `Nội dung CK: ${description.trim()}`, bold: false, size: 16 });
  }
  if (accountName && accountName.trim()) {
    lines.push({
      text: `Tên chủ TK: ${accountName.trim().toUpperCase()}`,
      bold: false,
      size: 16,
    });
  }
  if (accountNumber && String(accountNumber).trim()) {
    const label = isCard ? "Số thẻ" : "Số TK";
    lines.push({
      text: `${label}: ${String(accountNumber).trim()}`,
      bold: true,
      size: 18,
    });
  }
  if (bankFullName && bankFullName.trim()) {
    lines.push({ text: bankFullName.trim(), bold: false, size: 15 });
  }
  return lines;
}

function calculateCardDimensions(template, printLines) {
  if (template !== "print") {
    return { width: 540, height: 540 };
  }
  return { width: 600, height: 590 + printLines.length * 28 + 16 };
}

/* ============================ Canvas ============================ */

function drawQrMatrix(ctx, matrix, x, y, size) {
  const moduleSize = size / matrix.size;
  ctx.fillStyle = "#000000";
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (matrix.data[row * matrix.size + col]) {
        ctx.fillRect(
          x + col * moduleSize,
          y + row * moduleSize,
          Math.ceil(moduleSize),
          Math.ceil(moduleSize),
        );
      }
    }
  }
}

function drawCenterIcon(ctx, iconImg, boxX, boxY, boxSize, radius, iconSize) {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, boxX, boxY, boxSize, boxSize, radius);
  ctx.fill();
  const iconX = boxX + (boxSize - iconSize) / 2;
  const iconY = boxY + (boxSize - iconSize) / 2;
  ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawFooter(ctx, canvasWidth, footerCenterY, bankLogoImg, bankName) {
  const napasImg = await loadImage(napasLogoUrl).catch(() => null);
  const targetVisualHeight = 35;

  let napas = null;
  let napasScale = 1;
  if (napasImg) {
    const bounds = getVisualBounds(napasImg);
    napasScale = targetVisualHeight / bounds.h;
    napas = {
      bounds,
      w: bounds.w * napasScale,
      h: bounds.h * napasScale,
    };
  }

  ctx.font = "bold 24px Arial, sans-serif";
  let bank = null;
  let bankScale = napasScale;
  if (bankLogoImg) {
    const bounds = getVisualBounds(bankLogoImg);
    bankScale = targetVisualHeight / Math.max(1, bounds.h);
    if (bankLogoImg.naturalWidth >= 800 && bankLogoImg.naturalHeight >= 300) {
      bankScale = napasScale;
    }
    if (bounds.h * bankScale > 42) {
      bankScale = 42 / bounds.h;
    }
    if (bounds.w * bankScale > 220) {
      bankScale = 220 / bounds.w;
    }
    bank = { bounds, w: bounds.w * bankScale, h: bounds.h * bankScale };
  }

  const gap = 14;
  const lineWidth = 2;
  const bankTextWidth = !bank && bankName ? ctx.measureText(bankName).width : 0;  const bankW = bank ? bank.w : bankTextWidth;
  const totalGroupWidth = (napas ? napas.w : 0) + gap + lineWidth + gap + bankW;
  const groupStartX = (canvasWidth - totalGroupWidth) / 2;

  const napasX = groupStartX;
  const sepX = napasX + (napas ? napas.w : 0) + gap + lineWidth / 2;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(sepX, footerCenterY - 18);
  ctx.lineTo(sepX, footerCenterY + 18);
  ctx.stroke();

  if (napas) {
    const visualOffset = napas.bounds.centerY - napas.bounds.y;
    const napasY = footerCenterY - visualOffset * napasScale;
    ctx.drawImage(
      napasImg,
      napas.bounds.x,
      napas.bounds.y,
      napas.bounds.w,
      napas.bounds.h,
      napasX,
      napasY,
      napas.w,
      napas.h,
    );
  }
  const bankX = sepX + lineWidth / 2 + gap;
  if (bank) {
    const visualOffset = bank.bounds.centerY - bank.bounds.y;
    const bankY = footerCenterY - visualOffset * bankScale;
    ctx.drawImage(
      bankLogoImg,
      bank.bounds.x,
      bank.bounds.y,
      bank.bounds.w,
      bank.bounds.h,
      bankX,
      bankY,
      bank.w,
      bank.h,
    );
  } else if (bankName) {
    ctx.fillStyle = BANK_BLUE;
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(bankName, bankX, footerCenterY);
  }
}

async function renderCardCanvas(canvas, logicalWidth, logicalHeight, params) {
  const { template, matrix, bankLogoImg, bankName, printLines } = params;
  const isPrint = template === "print";
  const ctx = canvas.getContext("2d");
  const canvasWidth = logicalWidth;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Header: logo VietQR (cắt lề trắng, cao 46px — print 48px)
  const vietqrImg = await loadImage(vietqrLogoUrl).catch(() => null);
  if (vietqrImg) {
    const bounds = getVisualBounds(vietqrImg);
    const targetH = isPrint ? 48 : 46;
    const targetW = targetH * (bounds.w / bounds.h);
    const logoX = (canvasWidth - targetW) / 2;
    const logoY = isPrint ? 24 : 18;
    ctx.drawImage(
      vietqrImg,
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h,
      logoX,
      logoY,
      targetW,
      targetH,
    );
  }

  // Khung viền xanh + QR bên trong (cách viền 9px theo chuẩn vietqr.io)
  const qrFrameSize = 374;
  const frameX = (canvasWidth - qrFrameSize) / 2;
  const frameY = isPrint ? 96 : 84;
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(frameX, frameY, qrFrameSize, qrFrameSize);
  const padding = 9;
  drawQrMatrix(
    ctx,
    matrix,
    frameX + padding,
    frameY + padding,
    qrFrameSize - padding * 2,
  );

  // Icon trung tâm
  const centerIcon = params.customLogoImg || (await loadImage(vietqrIconUrl).catch(() => null));
  if (centerIcon) {
    const boxSize = 58;
    const boxX = (canvasWidth - boxSize) / 2;
    const boxY = frameY + (qrFrameSize - boxSize) / 2;
    drawCenterIcon(ctx, centerIcon, boxX, boxY, boxSize, 5, 46);
  }

  // Footer: napas247 | logo ngân hàng
  ctx.textBaseline = "alphabetic";
  await drawFooter(ctx, canvasWidth, isPrint ? 516 : 495, bankLogoImg, bankName);

  // Phần chữ của mẫu print
  if (isPrint && printLines.length) {
    ctx.fillStyle = NAVY;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    let currentY = 566;
    for (const line of printLines) {
      ctx.font = `${line.bold ? "bold " : ""}${line.size}px Arial, sans-serif`;
      ctx.fillText(line.text, canvasWidth / 2, currentY);
      currentY += line.bold ? 29 : 26;
    }
  }
}

function renderQrOnlyCanvas(ctx, params) {
  const { matrix, size, centerIcon } = params;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const padding = Math.max(10, Math.floor(size * 0.02));
  const innerSize = size - padding * 2;
  drawQrMatrix(ctx, matrix, padding, padding, innerSize);

  if (centerIcon) {
    const boxSize = Math.floor(innerSize * 0.18);
    const boxX = (size - boxSize) / 2;
    const radius = Math.max(4, Math.floor(boxSize * 0.12));
    drawCenterIcon(ctx, centerIcon, boxX, boxX, boxSize, radius, boxSize * 0.82);
  }
}

/* ============================= SVG ============================= */

function svgQrPath(matrix, x, y, size) {
  const moduleSize = size / matrix.size;
  let d = "";
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (matrix.data[row * matrix.size + col]) {
        d += `M${(x + col * moduleSize).toFixed(2)},${(y + row * moduleSize).toFixed(2)}h${moduleSize.toFixed(2)}v${moduleSize.toFixed(2)}h-${moduleSize.toFixed(2)}z `;
      }
    }
  }
  return d;
}

/**
 * Nhúng ảnh raster vào SVG có crop vùng nội dung (bỏ lề trắng) — thay cho
 * srcRect của Skia: dùng <svg> lồng với viewBox trùng vùng bounds, ảnh bên
 * trong giữ kích thước gốc nên đúng tỉ lệ.
 */
function svgCroppedImage(href, img, bounds, x, y, w, h) {
  return (
    `<svg x="${x}" y="${y}" width="${w}" height="${h}" ` +
    `viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}" ` +
    `preserveAspectRatio="none">` +
    `<image href="${href}" x="0" y="0" width="${img.naturalWidth}" height="${img.naturalHeight}"/></svg>`
  );
}

async function renderCardSvg(params) {
  const { template, matrix, bankLogoUrl, bankName, printLines, customLogoDataUrl } = params;
  const isPrint = template === "print";
  const { width, height } = calculateCardDimensions(template, printLines);

  const [vietqrData, napasData, bankData, iconData] = await Promise.all([
    toDataUrl(vietqrLogoUrl),
    toDataUrl(napasLogoUrl),
    toDataUrl(bankLogoUrl),
    customLogoDataUrl ? Promise.resolve(customLogoDataUrl) : toDataUrl(vietqrIconUrl),
  ]);

  const parts = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
  );

  // Header logo VietQR — crop lề trắng bằng svgCroppedImage
  if (vietqrData) {
    const img = await loadImage(vietqrLogoUrl).catch(() => null);
    if (img) {
      const bounds = getVisualBounds(img);
      const targetH = isPrint ? 48 : 46;
      const targetW = targetH * (bounds.w / bounds.h);
      const logoX = (width - targetW) / 2;
      const logoY = isPrint ? 24 : 18;
      parts.push(svgCroppedImage(vietqrData, img, bounds, logoX, logoY, targetW, targetH));
    }
  }

  const qrFrameSize = 374;
  const frameX = (width - qrFrameSize) / 2;
  const frameY = isPrint ? 96 : 84;
  parts.push(
    `<rect x="${frameX}" y="${frameY}" width="${qrFrameSize}" height="${qrFrameSize}" fill="none" stroke="${NAVY}" stroke-width="2.5"/>`,
    `<path fill="#000000" d="${svgQrPath(matrix, frameX + 9, frameY + 9, qrFrameSize - 18).trim()}"/>`,
  );

  const boxSize = 58;
  const boxX = (width - boxSize) / 2;
  const boxY = frameY + (qrFrameSize - boxSize) / 2;
  parts.push(
    `<rect x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}" rx="5" fill="#ffffff"/>`,
    `<image href="${iconData}" x="${boxX + 6}" y="${boxY + 6}" width="46" height="46" preserveAspectRatio="xMidYMid meet"/>`,
  );

  // Footer: napas247 | logo ngân hàng — dùng tỉ lệ đo từ bounds thật
  const footerCenterY = isPrint ? 516 : 495;
  const napasImg = await loadImage(napasLogoUrl).catch(() => null);
  const bankImg = bankLogoUrl ? await loadImage(bankLogoUrl).catch(() => null) : null;
  const targetVisualHeight = 35;
  let napasW = 0;
  let napasScale = 1;
  let napasBounds = null;
  if (napasImg) {
    napasBounds = getVisualBounds(napasImg);
    napasScale = targetVisualHeight / napasBounds.h;
    napasW = napasBounds.w * napasScale;
  }
  let bankW = 0;
  let bankScale = napasScale;
  let bankBounds = null;
  if (bankImg) {
    bankBounds = getVisualBounds(bankImg);
    bankScale = targetVisualHeight / Math.max(1, bankBounds.h);
    if (bankImg.naturalWidth >= 800 && bankImg.naturalHeight >= 300) {
      bankScale = napasScale;
    }
    if (bankBounds.h * bankScale > 42) {
      bankScale = 42 / bankBounds.h;
    }
    if (bankBounds.w * bankScale > 220) {
      bankScale = 220 / bankBounds.w;
    }
    bankW = bankBounds.w * bankScale;
  }
  if (!bankImg && bankName) {
    bankW = bankName.length * 14;
  }
  const gap = 14;
  const lineWidth = 2;
  const groupStartX = (width - (napasW + gap + lineWidth + gap + bankW)) / 2;
  const sepX = groupStartX + napasW + gap + lineWidth / 2;
  parts.push(
    `<line x1="${sepX}" y1="${footerCenterY - 18}" x2="${sepX}" y2="${footerCenterY + 18}" stroke="${NAVY}" stroke-width="${lineWidth}"/>`,
  );
  if (napasImg && napasBounds) {
    const napasY = footerCenterY - (napasBounds.centerY - napasBounds.y) * napasScale;
    parts.push(
      svgCroppedImage(
        napasData,
        napasImg,
        napasBounds,
        groupStartX,
        napasY,
        napasW,
        napasBounds.h * napasScale,
      ),
    );
  }
  const bankX = sepX + lineWidth / 2 + gap;
  if (bankImg && bankBounds) {
    const bankY = footerCenterY - (bankBounds.centerY - bankBounds.y) * bankScale;
    parts.push(
      svgCroppedImage(
        bankData,
        bankImg,
        bankBounds,
        bankX,
        bankY,
        bankW,
        bankBounds.h * bankScale,
      ),
    );
  } else if (bankName) {
    parts.push(
      `<text x="${bankX}" y="${footerCenterY}" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${BANK_BLUE}">${escapeXml(bankName)}</text>`,
    );
  }

  if (isPrint) {
    let currentY = 566;
    for (const line of printLines) {
      parts.push(
        `<text x="${width / 2}" y="${currentY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${line.size}"${line.bold ? ' font-weight="bold"' : ""} fill="${NAVY}">${escapeXml(line.text)}</text>`,
      );
      currentY += line.bold ? 29 : 26;
    }
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

async function renderQrOnlySvg(params) {
  const { matrix, size, customLogoDataUrl } = params;
  const padding = Math.max(10, Math.floor(size * 0.02));
  const innerSize = size - padding * 2;
  const parts = [];
  parts.push(
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
    `<path fill="#000000" d="${svgQrPath(matrix, padding, padding, innerSize).trim()}"/>`,
  );
  const iconData = customLogoDataUrl || (await toDataUrl(vietqrIconUrl));
  if (iconData) {
    const boxSize = innerSize * 0.18;
    const boxX = padding + (innerSize - boxSize) / 2;
    const bgPadding = 4;
    parts.push(
      `<rect x="${boxX - bgPadding}" y="${boxX - bgPadding}" width="${boxSize + bgPadding * 2}" height="${boxSize + bgPadding * 2}" rx="6" fill="#ffffff"/>`,
      `<image href="${iconData}" x="${boxX}" y="${boxX}" width="${boxSize}" height="${boxSize}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }
  parts.push(`</svg>`);
  return parts.join("\n");
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================ API ============================ */

const RASTER_MIME = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Render ảnh thẻ VietQR.
 *
 * @param {Object} params
 * @param {string} params.payload chuỗi EMVCo
 * @param {"compact"|"qr_only"|"print"} params.template
 * @param {"png"|"jpeg"|"webp"|"svg"} params.format
 * @param {string|null} params.bankLogoUrl URL logo ngân hàng (asset hoặc data URL)
 * @param {string|null} params.bankName tên thay thế khi không có logo
 * @param {string|null} params.accountNumber
 * @param {string|null} params.accountName
 * @param {number|null} params.amount
 * @param {string|null} params.description
 * @param {boolean} params.isCard true → nhãn "Số thẻ"
 * @param {string|null} params.customLogoDataUrl logo tâm tùy chọn (data URL)
 * @param {number} [params.size] kích thước mẫu qr_only (mặc định 500)
 * @returns {Promise<string>} data URL của ảnh
 */
export async function renderVietQrImage(params) {
  const template = params.template || "compact";
  const format = params.format || "png";
  const matrix = createQrMatrix(params.payload);
  const printLines =
    template === "print"
      ? buildPrintLines({
          amount: Number(params.amount) || 0,
          description: params.description,
          accountNumber: params.accountNumber,
          accountName: params.accountName,
          bankFullName: params.bankFullName,
          isCard: params.isCard,
        })
      : [];

  if (format === "svg") {
    const svg =
      template === "qr_only"
        ? await renderQrOnlySvg({
            matrix,
            size: params.size || 500,
            customLogoDataUrl: params.customLogoDataUrl,
          })
        : await renderCardSvg({ ...params, matrix, printLines });
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  const bankLogoImg = params.bankLogoUrl
    ? await loadImage(params.bankLogoUrl).catch(() => null)
    : null;
  const customLogoImg = params.customLogoDataUrl
    ? await loadImage(params.customLogoDataUrl).catch(() => null)
    : null;
  const defaultIconImg = await loadImage(vietqrIconUrl).catch(() => null);

  // Vẽ 2x để ảnh tải về sắc nét, hệ toạ độ vẽ vẫn theobố cục gốc 540px
  const scale = 2;
  let canvas;
  if (template === "qr_only") {
    const size = params.size || 500;
    canvas = document.createElement("canvas");
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    renderQrOnlyCanvas(ctx, {
      matrix,
      size,
      // qr_only luôn có icon tâm: logo tùy chọn hoặc icon VietQR mặc định
      centerIcon: customLogoImg || defaultIconImg,
    });
  } else {
    const { width, height } = calculateCardDimensions(template, printLines);
    canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    await renderCardCanvas(canvas, width, height, {
      payload: params.payload,
      template,
      matrix,
      bankLogoImg,
      bankName: params.bankName,
      printLines,
      customLogoImg,
    });
  }
  const mime = RASTER_MIME[format] || "image/png";
  const quality = format === "png" ? undefined : 0.95;
  return canvas.toDataURL(mime, quality);
}
