WITH input AS (
  SELECT
    'public'::text AS schema_name,
    'your_table_name'::text AS table_name
)
SELECT
  c.column_name || ',' AS column_name_with_comma,
  'l.' || c.column_name || ',' AS alias_column_with_comma,
  c.column_name || ' ' || c.data_type
    || CASE WHEN c.is_nullable = 'NO' THEN ' not null' ELSE '' END
    || CASE WHEN c.column_default IS NOT NULL THEN ' default ' || c.column_default ELSE '' END
    || ',' AS column_declare,
  'COMMENT ON COLUMN ' || c.table_schema || '.' || c.table_name || '.' || c.column_name
    || ' IS ' || COALESCE(quote_literal(d.description), 'NULL') || ';' AS comment_sql,
  c.*
FROM input i
JOIN information_schema.columns c ON c.table_schema = i.schema_name AND c.table_name = i.table_name
LEFT JOIN pg_catalog.pg_statio_all_tables t ON c.table_name = t.relname AND c.table_schema = t.schemaname
LEFT JOIN pg_catalog.pg_description d ON d.objoid = t.relid AND d.objsubid = c.ordinal_position
ORDER BY c.ordinal_position
LIMIT 100;
