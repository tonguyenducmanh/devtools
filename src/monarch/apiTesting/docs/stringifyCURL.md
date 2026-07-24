Convert a request object into a CURL command text string.

Takes `{ apiUrl, httpMethod?, headersText?, bodyText? }`. Returns the CURL command string.

### Examples
```js
// Basic GET
let curl = stringifyCURL({ apiUrl: "https://api.example.com/users" });
// curl = "curl 'https://api.example.com/users'"

// POST with headers and body
let curl = stringifyCURL({
  apiUrl: "https://api.example.com/users",
  httpMethod: "POST",
  headersText: "Content-Type:application/json\nAuthorization:Bearer token123",
  bodyText: '{"name":"test","email":"test@example.com"}'
});
// curl = "curl 'https://api.example.com/users' --request POST --header 'Content-Type:application/json' --header 'Authorization:Bearer token123' --data '{\"name\":\"test\",\"email\":\"test@example.com\"}'"

// GET with custom header only
let curl = stringifyCURL({
  apiUrl: "https://api.example.com/me",
  httpMethod: "GET",
  headersText: "Authorization:Bearer mytoken"
});
```
