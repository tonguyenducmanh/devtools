SELECT
  pg_get_functiondef({oid}::oid) AS ddl
limit
  1;