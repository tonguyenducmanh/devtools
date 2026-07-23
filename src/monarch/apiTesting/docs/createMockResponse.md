Build mock API response objects from request responses. Local only — does not call any API.

Takes an array of response objects (from `request()` or `requestCURL()`) and returns an array of mock objects ready to be JSON-stringified and imported manually into the Mock API tool.

Each response object can contain:
- `status` (number) - HTTP status code
- `headers` (object|string) - response headers
- `body` (any) - response body
- `request` (optional) - `{ method, url, headers, body }` to auto-fill endpoint/method

### Examples
```js
// Gọi API thật và tạo mock từ response
let res = await request({
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {},
  body: null,
});
let mock = createMockResponse([{
  ...res,
  request: { method: 'GET', url: 'https://api.example.com/users' }
}]);

// Copy JSON result để import thủ công vào Mock API tool
copy(JSON.stringify(mock, null, 2));

// Tạo mock từ nhiều responses
let res1 = await requestCURL(`curl 'https://api.example.com/users'`);
let res2 = await requestCURL(`curl 'https://api.example.com/products'`);
let mocks = createMockResponse([
  { ...res1, request: { method: 'GET', url: 'https://api.example.com/users' } },
  { ...res2, request: { method: 'GET', url: 'https://api.example.com/products' } }
]);
copy(JSON.stringify(mocks, null, 2));
```
