WITH input AS (
  SELECT ARRAY['%column1%', '%column2%']::text[] AS search_columns
)
SELECT
  c.table_schema,
  c.table_name
FROM information_schema.columns c, input i
WHERE c.column_name = ANY(i.search_columns)
GROUP BY c.table_schema, c.table_name
HAVING COUNT(DISTINCT c.column_name) = array_length(i.search_columns, 1)
ORDER BY c.table_schema, c.table_name limit 100;