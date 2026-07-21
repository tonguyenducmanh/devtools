**requestMultiCURL(curlTexts[])**

Gửi nhiều request CURL về backend chạy đồng thời bằng Go goroutines.

Tham số:
- `curlTexts`: Mảng các CURL string cần chạy song song

Trả về `Promise<Array<{status, headers, body}>>` theo đúng thứ tự input.

Ví dụ:
```js
let results = await requestMultiCURL([
  `curl 'https://api.example.com/a'`,
  `curl 'https://api.example.com/b'`,
]);
```
