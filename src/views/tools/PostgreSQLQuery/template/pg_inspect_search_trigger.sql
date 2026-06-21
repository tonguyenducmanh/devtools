SELECT n.nspname AS schema_name, t.tgname AS object_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
  {schemaFilter}
  AND t.tgname ILIKE '{value}'
ORDER BY n.nspname, t.tgname
LIMIT {limit};
