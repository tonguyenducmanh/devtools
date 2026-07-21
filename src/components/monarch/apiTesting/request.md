**request({method, url, headers, body})**

Gọi HTTP request trực tiếp, không cần CURL string.

Tham số:
- `method`: HTTP method (GET, POST, PUT, PATCH, DELETE)
- `url`: URL endpoint
- `headers`: Headers - object `{key: value}` hoặc string `"key:value"` mỗi dòng
- `body`: Request body - object (tự stringify JSON), string, hoặc null

Trả về `Promise<{status, headers, body}>`.

Ví dụ:
```js
let res = await request({
  method: 'POST',
  url: 'https://api.example.com/users',
  headers: { 'Content-Type': 'application/json' },
  body: { name: 'Alice', age: 30 }
});
```
