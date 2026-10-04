/**
 * Registry canvas cho các web app "craft" (PhotoCraft / VectorCraft).
 *
 * ── Vấn đề ──────────────────────────────────────────────────────────────────
 * Rust trong `apps/<app>-web/src/web.rs` tìm canvas bằng `document.getElementById`
 * với id CỐ ĐỊNH rồi giữ thẳng tham chiếu element — phía wasm không nhận element
 * nào từ JS, cũng không đổi id được. Để mỗi tab (kể cả nhiều tab cùng một app)
 * gắn đúng canvas của mình mà không phải đổi id lung tung, ta shim
 * `getElementById`: với đúng id của app craft thì trả canvas đã đăng ký, mọi id
 * khác đi xuyên về bản gốc.
 *
 * ── Vì sao phải là singleton ────────────────────────────────────────────────
 * Shim và registry được gắn NGAY TRÊN function `document.getElementById`, KHÔNG
 * nằm ở module scope. Nhờ vậy dù module này bị evaluate lại (HMR lúc dev, hay
 * bundler nhân bản chunk) thì:
 *   - không bao giờ bọc `getElementById` hai lần;
 *   - registry và bộ đếm instance vẫn giữ nguyên, các instance đã đăng ký từ
 *     trước không bị mất;
 *   - nếu không làm vậy, mỗi bản module sẽ có `Map` riêng và `seq` riêng bắt đầu
 *     từ 0 → hai tab có thể cùng `instanceKey` → trùng URL glue → browser trả về
 *     cùng một module → wasm-bindgen `if (wasm !== undefined) return wasm;` khiến
 *     app thứ hai không chạy (canvas đứng ở kích thước mặc định 300x150).
 */

const SHIM_FLAG = "__tmCraftShim";
const REGISTRY_KEY = "__tmCraftRegistry";
const SEQ_KEY = "__tmCraftSeq";

function ensureShim() {
  const current = document.getElementById;
  // Đã có shim (kể cả do một bản module khác cài) → dùng lại, không bọc thêm
  if (current && current[SHIM_FLAG]) return current;

  const original = current.bind(document);
  const registry = new Map();
  let seq = 0;

  const shim = function (elementId) {
    if (typeof elementId === "string" && registry.has(elementId)) {
      const canvas = registry.get(elementId);
      // Canvas đã bị gỡ khỏi DOM (tab đóng) → xoá khoá để lần sau rơi về bản gốc
      if (canvas && canvas.isConnected) return canvas;
      registry.delete(elementId);
    }
    return original(elementId);
  };

  shim[SHIM_FLAG] = true;
  shim[REGISTRY_KEY] = registry;
  // Bộ đếm cũng nằm trên shim để không reset khi module bị evaluate lại
  shim[SEQ_KEY] = () => ++seq;
  shim.__tmCraftOriginal = original;

  document.getElementById = shim;
  return shim;
}

/**
 * Đăng ký canvas cho tab đang active của một app craft.
 * @param {string} canvasId id cố định mà Rust tra, ví dụ "photocraft_canvas"
 * @param {HTMLCanvasElement} canvas
 */
export function registerCraftCanvas(canvasId, canvas) {
  if (!canvas) return;
  ensureShim()[REGISTRY_KEY].set(canvasId, canvas);
}

/**
 * Bỏ đăng ký canvas (tab đóng). Chỉ xoá nếu đúng canvas đang đăng ký.
 */
export function unregisterCraftCanvas(canvasId, canvas) {
  const registry = document.getElementById?.[REGISTRY_KEY];
  if (registry && registry.get(canvasId) === canvas) {
    registry.delete(canvasId);
  }
}

/**
 * Khoá riêng cho một instance (mỗi tab cần một instance wasm riêng vì trình duyệt
 * cache module theo URL, còn wasm-bindgen chỉ instantiate một lần cho mỗi module).
 */
export function nextCraftInstanceKey(appKey) {
  return `${appKey}-${ensureShim()[SEQ_KEY]()}`;
}

/** Chỉ dùng để debug/kiểm thử: shim đang được cài đúng một lần. */
export function isCraftCanvasShimInstalled() {
  return Boolean(document.getElementById?.[SHIM_FLAG]);
}

/** Chỉ dùng để debug/kiểm thử: số canvas đang được đăng ký. */
export function craftCanvasRegistrySize() {
  return document.getElementById?.[REGISTRY_KEY]?.size ?? 0;
}