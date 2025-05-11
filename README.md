## Project chứa các tool tiện ích cho dev, được tổng hợp nhằm mục đích tránh phải deploy mỗi tool lên 1 site khác nhau

Có 2 phiên bản được support: phiên bản web (vue + vite) và phiên bản app (electron + vue + vite)

Danh sách các tính năng đã support

```
1. So sánh code ( giống github pull request)
2. JSON parse đệ quy
3. Base64 sang image
4. Image sang base64
5. Sinh script postgresql insert vào db từ json data
6. Văn bản sang nhiều mã QR
7. Nhiều mã QR sang 1 đoạn văn bản duy nhất
8. Mapping đệ quy value theo key của 2 object json ( object lồng object cũng map)
9. Tải extension vscode (legacy)
10. Tạo UUIDv4 ngẫu nhiên
11. Tạo OTP (TOTP)
```

Demo 1 số tính năng

![alt text](img/demo_otp.png)

Config của toàn bộ ứng dụng có thể truy cập thông qua việc enter lệnh sau ở cửa sổ console

```
window.__env
```

Các object global được inject trong file renderer.js, vd $tdCache = import TDCache.js, $tdEnum = import TDEnum.js

file [mock.js](src/mock/mock.js) sẽ được dùng để fake data cho từng tool
