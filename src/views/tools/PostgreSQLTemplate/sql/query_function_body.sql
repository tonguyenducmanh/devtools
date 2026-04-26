-- query nội dung function
SELECT 
    proname AS function_name,
    pg_get_functiondef(p.oid) AS definition
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON n.oid = p.pronamespace
WHERE 
    proname = 'your_function_name'  -- replace with your actual function name
    AND n.nspname = 'your_schema_name'; -- optional, to filter by schema