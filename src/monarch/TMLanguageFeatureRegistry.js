/**
 * Registry các "language feature" của TMTextEditor.
 *
 * Mỗi feature mô tả mọi thứ riêng của một ngôn ngữ (JSON, SQL, ...) để
 * TMTextEditor không phải hardcode bất kỳ language id nào:
 *
 * {
 *   id: string,
 *   languages: string[],
 *   footerControls?: Component,          // component render trong footer
 *   getActions?: (context) => Action[],  // action descriptor cho Monaco context menu
 *   preview?: { transform: (text) => string } // bật chế độ xem trước chỉ-đọc
 * }
 *
 * `context` truyền cho getActions gồm:
 * - editorApi.getValue()/getSourceValue()/applyText(text)/exitPreview()/notifyError()
 * - onError(error)
 * - t(key) để dịch label nếu cần
 *
 * Muốn thêm ngôn ngữ mới: tạo module trong src/monarch/<language>/ rồi
 * gọi registerLanguageFeature(feature) — không sửa TMTextEditor.
 */

import jsonEditorFeature from "./json/index.js";

const featureByLanguage = new Map();

/**
 * Đăng ký một language feature.
 * @param {Object} feature
 */
export function registerLanguageFeature(feature) {
  if (!feature || !feature.id || !Array.isArray(feature.languages)) {
    return;
  }
  feature.languages.forEach((language) => {
    featureByLanguage.set(language, feature);
  });
}

// Đăng ký các feature có sẵn trong dự án
registerLanguageFeature(jsonEditorFeature);

/**
 * Lấy feature tương ứng với language hiện tại.
 * @param {string} language
 * @returns {Object|null}
 */
export function resolveLanguageFeature(language) {
  if (!language) {
    return null;
  }
  return featureByLanguage.get(language) || null;
}

/**
 * Danh sách language đã có feature (dùng cho test/debug hoặc menu chọn ngôn ngữ).
 * @returns {string[]}
 */
export function getFeatureLanguages() {
  return Array.from(featureByLanguage.keys());
}
