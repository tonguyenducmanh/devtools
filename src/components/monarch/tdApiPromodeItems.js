/**
 * Cấu hình集中 cho tất cả completion/hover items của language "td-api-javascript".
 * Mỗi item chứa: label, insertText, sortText, và documentation từ file .md.
 *
 * Khi thêm hàm mới:
 * 1. Tạo file .md trong thư mục docs/
 * 2. Thêm entry vào API_ITEMS bên dưới
 */
import requestCURLDoc from "./docs/requestCURL.md?raw";
import requestDoc from "./docs/request.md?raw";
import parseResponseDoc from "./docs/parseResponse.md?raw";
import requestMultiDoc from "./docs/requestMulti.md?raw";
import requestMultiCURLDoc from "./docs/requestMultiCURL.md?raw";

export const API_ITEMS = [
  {
    label: "requestCURL",
    insertText: "await requestCURL(${1:curlString})",
    sortText: "0",
    documentation: requestCURLDoc,
  },
  {
    label: "request",
    insertText: "await request({ method: ${1:'GET'}, url: ${2:url}, headers: ${3:headers}, body: ${4:body} })",
    sortText: "1",
    documentation: requestDoc,
  },
  {
    label: "parseResponse",
    insertText: "parseResponse(${1:response})",
    sortText: "2",
    documentation: parseResponseDoc,
  },
  {
    label: "requestMulti",
    insertText: "await requestMulti(${1:[{method, url, headers, body}]})",
    sortText: "3",
    documentation: requestMultiDoc,
  },
  {
    label: "requestMultiCURL",
    insertText: "await requestMultiCURL(${1:[curlString1, curlString2]})",
    sortText: "4",
    documentation: requestMultiCURLDoc,
  },
];

/**
 * Trả về danh sách label tất cả các items (dùng cho hover lookup).
 */
export function getItemLabels() {
  return API_ITEMS.map((item) => item.label);
}
