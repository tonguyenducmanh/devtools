Convert a date to Unix timestamp in milliseconds.

Takes a Date object, date string, or existing timestamp. Returns integer milliseconds.

### Examples
```js
let ts = convertToUnixMiliSecondTime('2024-01-15');
console.log(ts); // 1705276800000

let ts2 = convertToUnixMiliSecondTime(new Date());
```
