Read all text files in a folder via the agent server.

Takes a folder path (absolute). Returns an array of `{ name, content }` objects. Only reads text files (json, txt, js, ts, md, csv, xml, yaml, sql, html, css, go, py, java, etc.), skips binary files. Max 50MB total.

### Examples
```js
// Read all files in a folder
let files = await readFolder('/home/user/test-data');
for (let file of files) {
  console.log(file.name, file.content.length);
}

// Parse all JSON files in a folder
let jsonFiles = await readFolder('/home/user/api-schemas');
let schemas = jsonFiles
  .filter(f => f.name.endsWith('.json'))
  .map(f => ({ name: f.name, data: JSON.parse(f.content) }));
```
