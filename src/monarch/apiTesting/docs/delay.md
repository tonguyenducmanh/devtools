Wait for a specified amount of time before continuing execution.

Takes seconds. Returns a promise that resolves after the delay.

### Examples
```js
// Wait 2 seconds
await delay(2);

// Wait between API calls
let res1 = await requestCURL(`curl 'https://api.example.com/step1'`);
await delay(1);
let res2 = await requestCURL(`curl 'https://api.example.com/step2'`);
```
