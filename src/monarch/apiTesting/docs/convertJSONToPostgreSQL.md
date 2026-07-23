Convert JSON data to PostgreSQL INSERT scripts.

Takes a JSON array (or single object) and a config object. Returns a complete SQL string with optional CREATE TABLE, DELETE, and INSERT statements.

Config options:
- `tableName` (required) - target table name
- `schemaName` (optional) - schema prefix (e.g. "public")
- `primaryKeyField` (optional) - primary key column name
- `enableCreateTable` (optional) - generate CREATE TABLE IF NOT EXISTS
- `enableDeleteScript` (optional) - generate DELETE before INSERT

### Examples
```js
// Convert JSON array to INSERT statements
let jsonData = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
];
let sql = convertJSONToPostgreSQL(jsonData, {
  tableName: "users",
  schemaName: "public",
  primaryKeyField: "id",
  enableCreateTable: true,
  enableDeleteScript: true
});
console.log(sql);

// Convert single object
let single = { id: 1, name: "Test" };
let sql2 = convertJSONToPostgreSQL(single, {
  tableName: "items",
  enableCreateTable: true
});
```
