/**
 * Tiện ích JSON thuần (không phụ thuộc Vue/Monaco) để có thể tái sử dụng
 * ở tool, context menu của editor và viết unit test độc lập.
 */

/**
 * Parse text JSON, ném lỗi nếu text rỗng hoặc không hợp lệ.
 * @param {string} text
 * @returns {*}
 */
export function parseJSONText(text) {
  if (!text || !text.trim()) {
    throw new Error("JSON content is empty");
  }
  return JSON.parse(text);
}

/**
 * In đẹp một giá trị bất kỳ ra text JSON.
 * @param {*} value
 * @returns {string}
 */
export function formatJSON(value) {
  return JSON.stringify(value, null, 2);
}

/**
 * Đệ quy biến các chuỗi con trông như JSON thành object thật.
 * Ví dụ: { data: "{\"id\":1}" } -> { data: { id: 1 } }
 * Chuỗi không parse được sẽ được giữ nguyên.
 * @param {*} value
 * @returns {*}
 */
export function deepDeserializeJSON(value) {
  if (Array.isArray(value)) {
    return value.map((item) => deepDeserializeJSON(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.keys(value).reduce((result, key) => {
      result[key] = deepDeserializeJSON(value[key]);
      return result;
    }, {});
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const looksLikeJSON =
      (trimmed.startsWith("{") || trimmed.startsWith("[")) &&
      trimmed.length > 1;
    if (looksLikeJSON) {
      try {
        return deepDeserializeJSON(JSON.parse(trimmed));
      } catch (_) {
        return value;
      }
    }
  }

  return value;
}

/**
 * Parse text JSON rồi deserialize đệ quy và in đẹp lại.
 * @param {string} text
 * @returns {string}
 */
export function deserializeJSONText(text) {
  return formatJSON(deepDeserializeJSON(parseJSONText(text)));
}

/**
 * Sort đệ quy key của object JSON theo alphabet (giữ nguyên thứ tự mảng).
 * @param {*} value
 * @returns {*}
 */
export function sortObjectByKey(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectByKey(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((result, key) => {
        result[key] = sortObjectByKey(value[key]);
        return result;
      }, {});
  }

  return value;
}

/**
 * Parse text JSON, sort key đệ quy rồi in đẹp lại.
 * @param {string} text
 * @returns {string}
 */
export function sortJSONTextByKey(text) {
  return formatJSON(sortObjectByKey(parseJSONText(text)));
}
