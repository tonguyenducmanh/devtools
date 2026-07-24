Convert a date to Unix timestamp in seconds.

Takes a Date object, date string, or existing timestamp. Returns integer seconds.

### Examples
```js
let ts = convertToUnixSecondTime('2024-01-15');
console.log(ts); // 1705276800

let ts2 = convertToUnixSecondTime(new Date());
console.log(ts2); // 1700000000
```
