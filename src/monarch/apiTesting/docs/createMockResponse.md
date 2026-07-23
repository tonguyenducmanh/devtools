Build mock API response objects from request/response pairs. Local only — does not call any API.

Accepts a single item or an array of items. Each item has `{ request, response }`.

**Input formats:**

`request` supports:
- **CURL string** — e.g. `"curl 'https://api.example.com/users'"` (parsed via `parseCURL`)
- **Object `{ method, url, headers, body }`** — from `request()` or `requestMulti()`
- **Object `{ apiUrl, httpMethod, headersText, bodyText }`** — internal format

`response` is `{ status, headers, body }` — from `request()`, `requestCURL()`, `requestMulti()`, or `requestMultiCURL()`.

**Output:** Array of mock objects ready to JSON-stringify and import into Mock API tool:
```json
{
  "request_name": "Mock 1",
  "group_id": "",
  "method": "GET",
  "api_url": "https://api.example.com/users",
  "headers_text": "",
  "body_text": "",
  "response_text": "{ ... }",
  "response_headers_text": "",
  "status_code": 200
}
```

### Examples
```js
// Single item with CURL string request
let res = await requestCURL(`curl 'https://api.example.com/users'`);
let mock = createMockResponse({
  request: `curl 'https://api.example.com/users'`,
  response: res
});
copy(JSON.stringify(mock, null, 2));

// Single item with object request
let res = await request({
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {},
  body: null,
});
let mock = createMockResponse({
  request: { method: 'GET', url: 'https://api.example.com/users' },
  response: res
});
copy(JSON.stringify(mock[0], null, 2));

// Multiple items
let res1 = await requestCURL(`curl 'https://api.example.com/users'`);
let res2 = await requestCURL(`curl 'https://api.example.com/products'`);
let mocks = createMockResponse([
  { request: `curl 'https://api.example.com/users'`, response: res1 },
  { request: `curl 'https://api.example.com/products'`, response: res2 }
]);
copy(JSON.stringify(mocks, null, 2));

// With options
let mocks = createMockResponse(items, { group_id: "abc", request_name: "My API" });
```
