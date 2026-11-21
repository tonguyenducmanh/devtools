import DOMPurify from "dompurify";
import { marked } from "marked";

// DOMPurify tự khởi tạo với `window` trong browser (bản ESM Vite đang bundle).
// Ở Node (không có window, ví dụ chạy script kiểm tra) nó là factory, không có
// hàm sanitize — khi đó bỏ qua bước sanitize; iframe dùng sandbox="" nên vẫn chặn
// script/HTML nguy hiểm. Không gọi DOMPurify() ở đây vì không có DOM để sanitize.
let purifier = typeof DOMPurify.sanitize === "function" ? DOMPurify : null;

/**
 * Chuyển markdown sang HTML đã sanitize. Hàm thuần, không phụ thuộc Vue hay tool cụ thể.
 */
export function renderMarkdownToHtml(source) {
  let html = marked.parse(source || "", { gfm: true, breaks: true });
  return purifier ? purifier.sanitize(html) : html;
}
