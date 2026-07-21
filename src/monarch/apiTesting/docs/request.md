Send an HTTP request with explicit parameters.

Takes `{ method, url, headers, body }`. Returns `{ status, headers, body }`.

### Examples
```js
let res = await request({
  method: 'GET',
  url: 'https://api.example.com/users',
  headers: {},
  body: null,
});
```
