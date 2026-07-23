/**
 * Cấu hình集中 cho tất cả completion/hover items của language "javascript".
 * Mỗi item chứa: label, insertText, sortText, và documentation từ file .md.
 *
 * Khi thêm hàm mới:
 * 1. Tạo file .md trong thư mục docs/
 * 2. Thêm entry vào ITEMS_CONFIG bên dưới
 */

const docModules = import.meta.glob("./docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function getDoc(name) {
  return docModules[`./docs/${name}.md`];
}

const ITEMS_CONFIG = [
  { label: "requestCURL", insertText: "await requestCURL()", sortText: "0", doc: "requestCURL" },
  { label: "request", insertText: "await request()", sortText: "1", doc: "request" },
  { label: "parseResponse", insertText: "parseResponse()", sortText: "2", doc: "parseResponse" },
  { label: "parseResponseMulti", insertText: "parseResponseMulti()", sortText: "2a", doc: "parseResponseMulti" },
  { label: "requestMulti", insertText: "await requestMulti()", sortText: "3", doc: "requestMulti" },
  { label: "requestMultiCURL", insertText: "await requestMultiCURL()", sortText: "4", doc: "requestMultiCURL" },
  { label: "readFile", insertText: "await readFile()", sortText: "5", doc: "readFile" },
  { label: "readFolder", insertText: "await readFolder()", sortText: "6", doc: "readFolder" },
  { label: "convertJSONToPostgreSQL", insertText: "convertJSONToPostgreSQL()", sortText: "7", doc: "convertJSONToPostgreSQL" },
  { label: "createMockResponse", insertText: "createMockResponse()", sortText: "8", doc: "createMockResponse" },
];

export const API_ITEMS = ITEMS_CONFIG.map((item) => ({
  ...item,
  documentation: getDoc(item.doc),
}));

export function getItemLabels() {
  return API_ITEMS.map((item) => item.label);
}
