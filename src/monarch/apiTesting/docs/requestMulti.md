Send multiple HTTP requests in parallel. Preserves input order.

Takes an array of `{ method, url, headers, body }`. Returns an array of `{ status, headers, body }`.

### Examples
```js
let [res1, res2] = await requestMulti([
  { method: 'GET', url: 'https://api.example.com/a', headers: {}, body: null },
  { method: 'POST', url: 'https://api.example.com/b', headers: {}, body: '{"k":"v"}' },
]);
```
