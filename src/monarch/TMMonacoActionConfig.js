/**
 * Dispatcher custom Monaco actions theo language.
 *
 * Toàn bộ logic đặc thù của từng ngôn ngữ nằm trong language feature
 * (src/monarch/<language>/), đăng ký ở TMLanguageFeatureRegistry.
 * File này chỉ là lớp trung gian để TMTextEditor không phụ thuộc trực tiếp
 * vào feature cụ thể nào.
 */

import { resolveLanguageFeature } from "./TMLanguageFeatureRegistry.js";

/**
 * Lấy danh sách action descriptors theo ngôn ngữ.
 * @param {string} language
 * @param {Object} context - { editorApi, onError, t, ... }
 * @returns {Array<Object>}
 */
export function getMonacoActionsByLanguage(language, context = {}) {
  const feature = resolveLanguageFeature(language);
  if (!feature || typeof feature.getActions !== "function") {
    return [];
  }
  return feature.getActions(context);
}
