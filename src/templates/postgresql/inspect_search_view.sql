WITH input AS (
  SELECT
    '%your_keyword%'::text AS search_keyword,
    ''::text AS schema_filter  -- để trống để tìm tất cả schema, hoặc nhập 'public'
)
SELECT
  n.nspname AS schema_name,
  c.relname AS view_name,
  CASE WHEN c.relkind = 'm' THEN 'MATERIALIZED' ELSE 'REGULAR' END AS view_type
FROM input i
JOIN pg_class c ON c.relname ILIKE i.search_keyword AND c.relkind IN ('v', 'm')
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE (i.schema_filter = '' OR n.nspname = i.schema_filter)
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, c.relname
LIMIT 100;
