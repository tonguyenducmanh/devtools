**requestMulti(requests[])**

Gửi nhiều request song song với tham số rõ ràng, không cần CURL string.

Tham số:
- `requests`: Mảng object `{ method, url, headers, body }`

Trả về `Promise<Array<{status, headers, body}>>` theo đúng thứ tự input.

Ví dụ:
```js
let results = await requestMulti([
  { method: 'GET', url: 'https://api.example.com/a', headers: '', body: null },
  { method: 'POST', url: 'https://api.example.com/b', headers: 'Content-Type:application/json', body: '{"key":"value"}' },
]);
```
