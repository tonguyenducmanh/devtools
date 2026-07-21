Execute a single CURL request via the agent server.

Returns `{ status, headers, body }`. Use `parseResponse()` to extract JSON.

### Examples
```js
let res = await requestCURL(`curl 'https://api.example.com/users'`);
let data = parseResponse(res);
```
