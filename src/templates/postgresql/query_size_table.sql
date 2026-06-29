WITH input AS (
  SELECT
    'public'::text AS schema_name,
    'your_table_name'::text AS table_name
)
SELECT
  i.schema_name || '.' || i.table_name AS table_full_name,
  pg_total_relation_size(quote_ident(i.schema_name) || '.' || quote_ident(i.table_name)) AS size_in_bytes,
  pg_size_pretty(pg_total_relation_size(quote_ident(i.schema_name) || '.' || quote_ident(i.table_name))) AS size_pretty
FROM input i
LIMIT 1;
