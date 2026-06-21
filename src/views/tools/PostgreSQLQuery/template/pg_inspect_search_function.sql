SELECT n.nspname AS schema_name, p.proname AS object_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prokind = 'f'
  {schemaFilter}
  AND p.proname ILIKE '{value}'
ORDER BY n.nspname, p.proname
LIMIT {limit};
