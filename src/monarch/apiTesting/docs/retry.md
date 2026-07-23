Execute a function with automatic retry on failure.

Takes a function and options: `{ attempts, delaySec, shouldRetry }`. Returns the result on success, or throws the last error if all attempts fail.

### Examples
```js
// Retry a flaky API up to 3 times, 2s between attempts
let res = await retry(
  () => requestCURL(`curl 'https://api.example.com/unstable'`),
  { attempts: 3, delaySec: 2 }
);
let data = parseResponse(res);

// Retry with custom condition (only retry on 5xx)
let res = await retry(
  () => requestCURL(`curl 'https://api.example.com/data'`),
  {
    attempts: 5,
    delaySec: 1,
    shouldRetry: (error) => error.status >= 500,
  }
);
```
