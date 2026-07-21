**requestCURL(curlString)**

Hàm gọi một request CURL thông qua agent server.

Tham số:
- `curlString`: Nội dung CURL cần thực thi

Trả về `{ status, headers, body }`.
Dùng `parseResponse()` để parse kết quả.
