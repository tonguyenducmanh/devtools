/**
 * Cấu hình集中 cho tất cả completion/hover items của language "javascript".
 * Mỗi item chứa: label, insertText, sortText, và documentation từ file .md.
 *
 * Khi thêm hàm mới:
 * 1. Tạo file .md trong thư mục docs/
 * 2. Thêm method vào TDAPITestingActions (auto-discover từ prototype)
 */

import TDAutomationInject from "@/common/automation/TDAutomationInject.js";

const docModules = import.meta.glob("./docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function getDoc(name) {
  return docModules[`./docs/${name}.md`];
}

const methodNames = Object.getOwnPropertyNames(
  TDAutomationInject.prototype,
).filter((name) => name !== "constructor");

const ITEMS_CONFIG = methodNames.map((name, index) => {
  let isAsync =
    TDAutomationInject.prototype[name]?.constructor?.name === "AsyncFunction";
  return {
    label: name,
    insertText: isAsync ? `await ${name}()` : `${name}()`,
    sortText: String(index).padStart(2, "0"),
    doc: name,
  };
});

export const API_ITEMS = ITEMS_CONFIG.map((item) => ({
  ...item,
  documentation: getDoc(item.doc),
}));

export function getItemLabels() {
  return API_ITEMS.map((item) => item.label);
}
