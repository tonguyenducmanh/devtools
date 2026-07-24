Generate a random UUID v4 string.

Returns a string in format `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.

### Examples
```js
let id = uuid();
console.log(id); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"

// Use as request body
let res = await request({
  method: 'POST',
  url: 'https://api.example.com/items',
  body: { id: uuid(), name: 'test' },
});
```
