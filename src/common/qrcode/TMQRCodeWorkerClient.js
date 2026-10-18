/**
 * Client của `TMQRCodeWorker` — nơi duy nhất khởi tạo worker cho các tool QR.
 *
 * Worker giữ toàn bộ phần nặng (sinh ma trận QR + encode PNG; decode ảnh +
 * tiền xử lý pixel + jsQR) để main thread không bị block, người dùng vẫn
 * click/switch tab trong lúc đang xử lý.
 */
import { getWorkerPool } from "@/common/worker/TMWorkerPool.js";

/**
 * Pool worker QR. `new Worker(new URL(...))` phải nằm literal tại đây để Vite
 * nhận ra và đóng gói riêng file worker.
 */
const qrWorkerPool = getWorkerPool(
  "qrcode",
  () =>
    new Worker(new URL("./TMQRCodeWorker.js", import.meta.url), {
      type: "module",
    }),
);

/**
 * Gửi 1 task tới worker QR.
 * @param {Object} message { type, payload }
 * @param {Object} [options]
 * @param {Transferable[]} [options.transfer]
 * @param {Function} [options.onMessage] nhận message tiến trình
 */
export function runQRWorkerTask(message, options = {}) {
  return qrWorkerPool.run(message, options);
}

/**
 * Tạo QR code từ nhiều chunk text, trả về data URL từng mã.
 *
 * @param {Array<{index:number, text:string}>} chunks
 * @param {Object} [options] option giống `qrcode` (width, margin, errorCorrectionLevel, color)
 * @param {Function} [onItem] callback ({index, src}) mỗi khi sinh xong 1 mã
 * @returns {Promise<{items: Array<{index:number, src:string}>, errors: Array}>}
 */
export async function generateQRItems(chunks, options = {}, onItem = null) {
  if (!chunks || chunks.length === 0) {
    return { items: [], errors: [] };
  }
  const result = await runQRWorkerTask(
    { type: "gen", payload: { chunks, options } },
    {
      onMessage: (message) => {
        if (typeof onItem === "function" && message.type === "gen-item") {
          onItem({ index: message.index, src: message.src });
        }
      },
    },
  );
  return result;
}

/**
 * Đọc QR từ danh sách file ảnh (chạy trong worker).
 *
 * @param {File[]|Blob[]} files
 * @param {Object} [options]
 * @param {boolean} [options.scanMultiple] 1 ảnh có thể chứa nhiều QR
 * @param {Function} [options.onProgress] callback ({fileName, done, total})
 * @returns {Promise<{results: Array<{fileName:string, parts: Array, error: string|null}>}>}
 */
export async function scanQRFiles(files, options = {}) {
  const { scanMultiple = true, onProgress = null } = options;
  const payloadFiles = (files || []).map((file, index) => ({
    name: file.name || `qr_${index + 1}`,
    type: file.type,
    blob: file,
  }));

  const result = await runQRWorkerTask(
    { type: "scan", payload: { files: payloadFiles, scanMultiple } },
    {
      onMessage: (message) => {
        if (
          typeof onProgress === "function" &&
          message.type === "scan-progress"
        ) {
          onProgress({
            fileName: message.fileName,
            done: message.done,
            total: message.total,
          });
        }
      },
    },
  );
  return result;
}

export default { runQRWorkerTask, generateQRItems, scanQRFiles };
