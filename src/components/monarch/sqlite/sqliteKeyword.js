/**
 * SQLite keyword list cho syntax highlighting và intellisense
 */

export const SQLITE_KEYWORDS = [
  "ABORT", "ACTION", "ADD", "AFTER", "ALL", "ALTER", "ANALYZE", "AND", "AS",
  "ASC", "ATTACH", "AUTOINCREMENT", "BEFORE", "BEGIN", "BETWEEN", "BY", "CASCADE",
  "CASE", "CAST", "CHECK", "COLLATE", "COLUMN", "COMMIT", "CONFLICT", "CONSTRAINT",
  "CREATE", "CROSS", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP", "DATABASE",
  "DEFAULT", "DEFERRABLE", "DEFERRED", "DELETE", "DESC", "DETACH", "DISTINCT", "DROP",
  "EACH", "ELSE", "END", "ESCAPE", "EXCEPT", "EXCLUSIVE", "EXISTS", "EXPLAIN",
  "FAIL", "FOR", "FOREIGN", "FROM", "FULL", "GLOB", "GROUP", "HAVING", "IF",
  "IGNORE", "IMMEDIATE", "IN", "INDEX", "INDEXED", "INITIALLY", "INNER", "INSERT",
  "INSTEAD", "INTERSECT", "INTO", "IS", "ISNULL", "JOIN", "KEY", "LEFT", "LIKE",
  "LIMIT", "MATCH", "NATURAL", "NO", "NOT", "NOTNULL", "NULL", "OF", "OFFSET",
  "ON", "OR", "ORDER", "OUTER", "PLAN", "PRAGMA", "PRIMARY", "QUERY", "RAISE",
  "RECURSIVE", "REFERENCES", "REGEXP", "REINDEX", "RELEASE", "RENAME", "REPLACE",
  "RESTRICT", "RIGHT", "ROLLBACK", "ROW", "ROWS", "SAVEPOINT", "SELECT", "SET",
  "TABLE", "TEMP", "TEMPORARY", "THEN", "TO", "TRANSACTION", "TRIGGER", "UNION",
  "UNIQUE", "UPDATE", "USING", "VACUUM", "VALUES", "VIEW", "VIRTUAL", "WHEN",
  "WHERE", "WINDOW", "WITH", "WITHOUT",
  "INTEGER", "REAL", "TEXT", "BLOB", "NUMERIC", "BOOLEAN", "DATE", "DATETIME",
  "TIMESTAMP", "VARCHAR", "CHAR", "CLOB", "DOUBLE", "FLOAT", "SMALLINT", "BIGINT",
  "DECIMAL", "YEAR", "MONTH", "DAY", "HOUR", "MINUTE", "SECOND",
];

/**
 * SQL keywords dùng để phân biệt với alias trong FROM/JOIN parsing
 */
export const SQL_ALIAS_KEYWORDS = [
  "where", "join", "on", "left", "right", "inner", "outer",
  "cross", "group", "order", "having", "limit", "select",
  "and", "or", "union", "except", "intersect",
];
