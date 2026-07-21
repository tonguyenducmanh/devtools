Send multiple CURL requests in parallel on the backend. Preserves input order.

Takes an array of CURL strings. Returns an array of `{ status, headers, body }`.

### Examples
```js
let [res1, res2] = await requestMultiCURL([
  `curl 'https://api.example.com/a'`,
  `curl 'https://api.example.com/b'`,
]);
```
