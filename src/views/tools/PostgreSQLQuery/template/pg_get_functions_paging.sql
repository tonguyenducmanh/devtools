SELECT
    n.nspname                              AS function_schema,
    p.proname                              AS function_name,
    pg_get_function_arguments(p.oid)       AS function_arguments,
    t.typname                              AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_type      t ON p.prorettype   = t.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND p.prokind = 'f'
ORDER BY n.nspname, p.proname
