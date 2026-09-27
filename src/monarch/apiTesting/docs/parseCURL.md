Parse a CURL command text into a structured request object.

Returns `{ url, method, headers, headersText, body, bodyText, formData }` or `null` if parsing fails.
`formData` chỉ có khi CURL dùng option `-F`, mỗi field có `{ key, value, type, fileName }`, với `type` là `text` hoặc `file`.
CURL dùng `-d` kèm `Content-Type: application/x-www-form-urlencoded` không phải multipart nên không sinh `formData`.
File trong CURL chỉ có đường dẫn (`-F 'file=@D:/tmp/a.png'`) nên không lấy được nội dung file, cần chọn lại file khi gửi.

### Examples
```js
// Basic usage
let parsed = parseCURL(`curl 'https://api.example.com/users' -H 'Authorization: Bearer token123'`);
// parsed = { url: "https://api.example.com/users", method: "GET", headers: { Authorization: "Bearer token123" }, ... }

// POST with body
let parsed = parseCURL(`curl 'https://api.example.com/users' -X POST -H 'Content-Type: application/json' -d '{"name":"test"}'`);
// parsed.method = "POST", parsed.bodyText contains the JSON

// POST with form data
let parsed = parseCURL(`curl 'https://api.example.com/upload' -X POST -F 'name=test' -F 'file=@D:/tmp/a.png'`);
// parsed.formData = [{ key: "name", value: "test", type: "text", fileName: "" }, { key: "file", value: "", type: "file", fileName: "D:/tmp/a.png" }]

// Fallback: parse fails gracefully
let parsed = parseCURL("invalid string");
// parsed = null
```
