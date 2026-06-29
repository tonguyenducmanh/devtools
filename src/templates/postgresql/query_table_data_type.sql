WITH input AS (
  SELECT
    'public'::text AS schema_name,
    'your_table'::text AS table_name,
    'your_column_name'::text AS column_name
)
SELECT
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  a.attnotnull AS is_not_null,
  a.atthasdef AS has_default,
  pg_get_expr(ad.adbin, ad.adrelid) AS default_value,
  a.attnum AS ordinal_position,
  d.description AS column_comment
FROM input i
JOIN pg_class c ON c.relname = i.table_name
JOIN pg_namespace n ON n.nspname = i.schema_name AND c.relnamespace = n.oid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
LEFT JOIN pg_attrdef ad ON ad.adrelid = c.oid AND ad.adnum = a.attnum
LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = a.attnum
WHERE a.attname = i.column_name
LIMIT 10;
