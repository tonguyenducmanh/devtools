/**
 * TMExcelClipboardUtil
 *
 * Dựng + ghi nội dung clipboard tương thích Excel / Google Sheets / WPS.
 *
 * Ghi đồng thời 2 mime type lên clipboard:
 *  - "text/html"  : bảng <table> → dán vào Excel/Sheets ra bảng thật, giữ định dạng
 *  - "text/plain" : TSV (tab phân cột, \n phân dòng) → fallback cho app chỉ nhận text
 *
 * Trình duyệt không hỗ trợ ClipboardItem hoặc bị chặn quyền thì tự lùi về
 * writeText(TSV) để vẫn dán được vào Excel/Sheets.
 */

/**
 * Chuẩn hóa 1 ô về chuỗi: null/undefined → "", object → JSON string.
 * @param {*} value giá trị ô
 * @returns {string}
 */
export function normalizeExcelCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Escape ký tự đặc biệt HTML để giá trị ô không phá cấu trúc bảng.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * TSV dùng tab + xuống dòng làm ký tự phân cách, nên value chứa ký tự đó
 * sẽ làm lệch ô. Thay bằng space để dán vào Excel vẫn đúng số cột.
 * @param {string} text
 * @returns {string}
 */
function toTsvCell(text) {
  return String(text).replace(/\r\n|\r|\n/g, " ").replace(/\t/g, " ");
}

/**
 * Dựng bảng ở dạng TSV (fallback text).
 * @param {string[]} headers danh sách tên cột
 * @param {Array<Array<*>>} rows ma trận dữ liệu, mỗi hàng là 1 mảng ô
 * @returns {string}
 */
export function buildExcelTsv(headers, rows) {
  let lines = [];
  if (Array.isArray(headers) && headers.length > 0) {
    lines.push(headers.map((h) => toTsvCell(normalizeExcelCell(h))).join("\t"));
  }
  (rows || []).forEach((row) => {
    let cells = Array.isArray(row) ? row : [row];
    lines.push(cells.map((c) => toTsvCell(normalizeExcelCell(c))).join("\t"));
  });
  return lines.join("\n");
}

/**
 * Dựng bảng ở dạng HTML để Excel/Sheets dán ra bảng thật (giữ format).
 * @param {string[]} headers danh sách tên cột
 * @param {Array<Array<*>>} rows ma trận dữ liệu, mỗi hàng là 1 mảng ô
 * @param {Object} [options]
 * @param {boolean} [options.boldHeader=true] in đậm dòng header
 * @returns {string}
 */
export function buildExcelHtml(headers, rows, { boldHeader = true } = {}) {
  let hasHeader = Array.isArray(headers) && headers.length > 0;
  let headerHtml = "";
  if (hasHeader) {
    let thTag = boldHeader ? "th" : "td";
    headerHtml =
      "<thead><tr>" +
      headers
        .map((h) => `<${thTag}>${escapeHtml(normalizeExcelCell(h))}</${thTag}>`)
        .join("") +
      "</tr></thead>";
  }

  let bodyHtml = (rows || [])
    .map((row) => {
      let cells = Array.isArray(row) ? row : [row];
      return (
        "<tr>" +
        cells
          .map((c) => `<td>${escapeHtml(normalizeExcelCell(c))}</td>`)
          .join("") +
        "</tr>"
      );
    })
    .join("");

  // Excel cần doc HTML đầy đủ + meta charset để giữ đúng tiếng Việt
  return (
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:x="urn:schemas-microsoft-com:office:excel">' +
    "<head><meta charset='utf-8'></head><body>" +
    `<table border="1" cellspacing="0" cellpadding="4">${headerHtml}<tbody>${bodyHtml}</tbody></table>` +
    "</body></html>"
  );
}

/**
 * Ghi bảng vào clipboard theo định dạng Excel.
 *
 * @param {string[]} headers danh sách tên cột (bỏ trống nếu chỉ copy dữ liệu)
 * @param {Array<Array<*>>} rows ma trận dữ liệu, mỗi hàng là 1 mảng ô
 * @param {Object} [options] xem buildExcelHtml
 * @returns {Promise<boolean>} true nếu ghi clipboard thành công
 */
export async function writeExcelToClipboard(headers, rows, options = {}) {
  let tsv = buildExcelTsv(headers, rows);

  // Ưu tiên bản HTML để dán vào Excel/Sheets ra bảng thật
  try {
    if (window.ClipboardItem && navigator.clipboard?.write) {
      let html = buildExcelHtml(headers, rows, options);
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([tsv], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch (error) {
    // Một số trình duyệt chặn ClipboardItem → lùi xuống TSV
    console.warn("Không ghi được clipboard HTML, fallback sang TSV", error);
  }

  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (error) {
    console.error("Không ghi được clipboard", error);
    return false;
  }
}