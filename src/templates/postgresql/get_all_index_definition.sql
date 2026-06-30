WITH
  input AS (
    SELECT
      'public'::text AS schema_name,
      'your_table_name'::text AS table_name
  )
SELECT
  i.relname AS index_name,
  ix.indisprimary AS is_primary,
  ix.indisunique AS is_unique,
  ix.indisvalid AS is_valid,
  am.amname AS index_type,
  array_to_string(
    ARRAY(
      SELECT
        pg_get_indexdef(ix.indexrelid, k + 1, TRUE)
      FROM
        generate_subscripts(ix.indkey, 1) AS k
      ORDER BY
        k
    ),
    ', '
  ) AS indexed_columns,
  pg_get_indexdef(ix.indexrelid) AS index_definition
FROM
  input inp
  JOIN pg_class t ON t.relname = inp.table_name
  JOIN pg_namespace n ON n.nspname = inp.schema_name
  AND n.oid = t.relnamespace
  JOIN pg_index ix ON ix.indrelid = t.oid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_am am ON am.oid = i.relam
WHERE
  t.relkind = 'r'
ORDER BY
  ix.indisprimary DESC,
  ix.indisunique DESC,
  i.relname
LIMIT
  50;