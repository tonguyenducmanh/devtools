Convert a Unix timestamp in seconds to a readable date string.

Returns string in format "YYYY-MM-DD HH:mm:ss".

### Examples
```js
let dateStr = readUnixSecondTime(1700000000);
console.log(dateStr); // "2023-11-14 22:13:20"

// Use in API response
let res = await requestCURL(`curl 'https://api.example.com/events'`);
let data = parseResponse(res);
console.log(readUnixSecondTime(data.created_at));
```
