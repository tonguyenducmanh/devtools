Read the content of a local file via the agent server.

Takes a file path (absolute). Returns the file content as a string. Throws if the file is not found or too large (limit 10MB).

### Examples
```js
// Read a JSON test data file
let content = await readFile('/home/user/data/test-api.json');
let data = JSON.parse(content);
console.log(data);

// Read a config file
let config = await readFile('/home/user/.env');
```
