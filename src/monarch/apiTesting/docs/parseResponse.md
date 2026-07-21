Parse the body of a response as JSON.

Works with results from `request()` or `requestCURL()`. Returns the parsed object, or the raw string if parsing fails.

### Examples
```js
let res = await requestCURL(`curl 'https://api.example.com/users'`);
let data = parseResponse(res);
```
