SELECT
  COUNT(*) AS total
FROM
  information_schema.tables t
WHERE
  t.table_schema IN ('pg_catalog', 'information_schema')
