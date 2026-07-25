Write content to a local file via the agent server.

Takes a file path (absolute) and content string. Creates parent directories if they don't exist. Returns the file path on success, or `null` on failure.

### Examples

```js
// Write a JSON file
let data = { name: "test", values: [1, 2, 3] };
let result = await writeFile(
  "/home/user/output/result.json",
  JSON.stringify(data, null, 2),
);
console.log("Written to:", result);

// Write CSV data
let csv = "id,name\n1,Alice\n2,Bob";
await writeFile("/home/user/data/users.csv", csv);
```
