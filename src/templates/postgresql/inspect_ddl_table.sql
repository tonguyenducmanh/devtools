WITH input AS (
  SELECT
    'public'::text AS schema_name,
    'your_table_name'::text AS table_name
),
table_def AS (
  SELECT
    'CREATE TABLE IF NOT EXISTS ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' (' || E'\n'
    || string_agg(
      '  ' || quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod)
      || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE ' NULL' END
      || COALESCE(' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid), ''),
      E',\n' ORDER BY a.attnum
    )
    || COALESCE(
      (SELECT E',\n  CONSTRAINT ' || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid)
       FROM pg_constraint con
       WHERE con.conrelid = c.oid AND con.contype = 'p'),
      ''
    )
    || E'\n);' AS def
  FROM input i
  JOIN pg_class c ON c.relname = i.table_name
  JOIN pg_namespace n ON n.nspname = i.schema_name AND c.relnamespace = n.oid
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
  GROUP BY n.nspname, c.relname, c.oid
),
foreign_keys AS (
  SELECT string_agg(
    'ALTER TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname)
    || ' ADD CONSTRAINT ' || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid) || ';',
    E'\n'
  ) AS fk_def
  FROM input i
  JOIN pg_class c ON c.relname = i.table_name
  JOIN pg_namespace n ON n.nspname = i.schema_name AND c.relnamespace = n.oid
  JOIN pg_constraint con ON con.conrelid = c.oid AND con.contype IN ('f')
),
indexes AS (
  SELECT string_agg(
    regexp_replace(pg_get_indexdef(ix.indexrelid), '^(CREATE (?:UNIQUE )?INDEX) ', '\1 IF NOT EXISTS ') || ';',
    E'\n'
  ) AS idx_def
  FROM input inp
  JOIN pg_class t ON t.relname = inp.table_name
  JOIN pg_namespace n ON n.nspname = inp.schema_name AND t.relnamespace = n.oid
  JOIN pg_index ix ON ix.indrelid = t.oid
  JOIN pg_class i ON i.oid = ix.indexrelid
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    WHERE con.conrelid = t.oid AND con.conindid = ix.indexrelid
  )
)
SELECT
  (SELECT '-- Create table script' || E'\n' || def FROM table_def)
  || COALESCE(E'\n\n' || (SELECT '-- Foreign keys' || E'\n' || fk_def FROM foreign_keys WHERE fk_def IS NOT NULL), '')
  || COALESCE(E'\n\n' || (SELECT '-- Indexes' || E'\n' || idx_def FROM indexes WHERE idx_def IS NOT NULL), '')
  AS ddl
LIMIT 1;
