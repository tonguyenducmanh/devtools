SELECT pg_get_functiondef(p.oid) AS ddl
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = '{schema}' AND p.proname = '{name}'
LIMIT 1;
