Generate a random integer in range [min, max] (inclusive).

### Examples
```js
let num = randomInt(1, 100);
console.log(num); // 42

// Use as query param
let page = randomInt(1, 10);
let res = await requestCURL(`curl 'https://api.example.com/items?page=${page}'`);
```
