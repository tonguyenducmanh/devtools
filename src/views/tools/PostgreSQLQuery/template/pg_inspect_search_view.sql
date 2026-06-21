SELECT n.nspname AS schema_name, c.relname AS object_name
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'v'
  {schemaFilter}
  AND c.relname ILIKE '{value}'
ORDER BY n.nspname, c.relname
LIMIT {limit};
