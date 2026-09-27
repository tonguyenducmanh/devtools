Convert a request object into a CURL command text string.

Takes `{ apiUrl, httpMethod?, headersText?, bodyText?, formData? }`. Returns the CURL command string.
Có key `formData` (mảng, kể cả rỗng) thì sinh option `--form` cho từng field, field dạng file trỏ tới `fileName` trên máy, đồng thời bỏ qua `Content-Type` trong `headersText` vì curl tự sinh kèm boundary.

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

// POST with form data
let curl = stringifyCURL({
  apiUrl: "https://api.example.com/upload",
  httpMethod: "POST",
  formData: [
    { key: "name", value: "test", type: "text" },
    { key: "file", type: "file", fileName: "D:/tmp/a.png" }
  ]
});
// curl = "curl 'https://api.example.com/upload' --request POST --form 'name=test' --form 'file=@D:/tmp/a.png'"

// GET with custom header only
let curl = stringifyCURL({
  apiUrl: "https://api.example.com/me",
  httpMethod: "GET",
  headersText: "Authorization:Bearer mytoken"
});
```
