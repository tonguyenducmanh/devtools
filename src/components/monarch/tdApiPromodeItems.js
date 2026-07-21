/**
 * Cấu hình集中 cho tất cả completion/hover items của language "td-api-javascript".
 * Mỗi item chứa: label, insertText, sortText, và documentation từ file .md.
 *
 * Khi thêm hàm mới:
 * 1. Tạo file .md trong thư mục docs/
 * 2. Thêm entry vào ITEMS_CONFIG bên dưới
 */

const docModules = import.meta.glob("./apiTesting/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function getDoc(name) {
  return docModules[`./apiTesting/${name}.md`];
}

const ITEMS_CONFIG = [
  { label: "requestCURL", insertText: "await requestCURL()", sortText: "0", doc: "requestCURL" },
  { label: "request", insertText: "await request()", sortText: "1", doc: "request" },
  { label: "parseResponse", insertText: "parseResponse()", sortText: "2", doc: "parseResponse" },
  { label: "requestMulti", insertText: "await requestMulti()", sortText: "3", doc: "requestMulti" },
  { label: "requestMultiCURL", insertText: "await requestMultiCURL()", sortText: "4", doc: "requestMultiCURL" },
];

export const API_ITEMS = ITEMS_CONFIG.map((item) => ({
  ...item,
  documentation: getDoc(item.doc),
}));

export function getItemLabels() {
  return API_ITEMS.map((item) => item.label);
}
