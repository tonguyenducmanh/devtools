Parse a CURL command text into a structured request object.

Returns `{ url, method, headers, headersText, body, bodyText }` or `null` if parsing fails.

### Examples
```js
// Basic usage
let parsed = parseCURL(`curl 'https://api.example.com/users' -H 'Authorization: Bearer token123'`);
// parsed = { url: "https://api.example.com/users", method: "GET", headers: { Authorization: "Bearer token123" }, ... }

// POST with body
let parsed = parseCURL(`curl 'https://api.example.com/users' -X POST -H 'Content-Type: application/json' -d '{"name":"test"}'`);
// parsed.method = "POST", parsed.bodyText contains the JSON

// Fallback: parse fails gracefully
let parsed = parseCURL("invalid string");
// parsed = null
```
