Parse an array of responses as JSON in one call.

Takes the result from `requestMultiCURL()` or `requestMulti()`. Returns an array of parsed bodies in the same order.

### Examples
```js
let responses = await requestMultiCURL([
  `curl 'https://api.example.com/a'`,
  `curl 'https://api.example.com/b'`,
]);
let allData = parseResponseMulti(responses);
// allData[0] -> parsed body of first request
// allData[1] -> parsed body of second request
```
