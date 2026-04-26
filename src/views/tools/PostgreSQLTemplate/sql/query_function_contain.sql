-- query xem 1 function chứa 1 đoạn text cụ thể
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    p.prosrc AS body
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON p.pronamespace = n.oid
WHERE 
    p.prosrc ILIKE '%0303987579%'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema');
