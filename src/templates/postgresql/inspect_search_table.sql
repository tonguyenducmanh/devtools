WITH input AS (
  SELECT
    '%your_keyword%'::text AS search_keyword,
    ''::text AS schema_filter  -- để trống để tìm tất cả schema, hoặc nhập 'public'
)
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  (SELECT COUNT(*) FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped) AS column_count
FROM input i
JOIN pg_class c ON c.relname ILIKE i.search_keyword AND c.relkind = 'r'
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE (i.schema_filter = '' OR n.nspname = i.schema_filter)
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname
LIMIT 100;
