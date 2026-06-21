SELECT
  'CREATE TRIGGER ' || quote_ident(t.tgname) || E'\n' ||
  CASE t.tgtype & 2 WHEN 2 THEN 'BEFORE' ELSE 'AFTER' END || ' ' ||
  CASE WHEN t.tgtype & 4 > 0 THEN 'INSERT ' ELSE '' END ||
  CASE WHEN t.tgtype & 8 > 0 THEN 'DELETE ' ELSE '' END ||
  CASE WHEN t.tgtype & 16 > 0 THEN 'UPDATE ' ELSE '' END ||
  'ON ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E'\n' ||
  'FOR EACH ' || CASE t.tgtype & 1 WHEN 1 THEN 'ROW' ELSE 'STATEMENT' END || E'\n' ||
  'EXECUTE FUNCTION ' || quote_ident(np.nspname) || '.' || quote_ident(p.proname) || '();' AS ddl
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace np ON p.pronamespace = np.oid
WHERE NOT t.tgisinternal
  AND n.nspname = '{schema}' AND t.tgname = '{name}'
LIMIT 1;
