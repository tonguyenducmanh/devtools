WITH
  table_def AS (
    SELECT
      'CREATE TABLE ' || quote_ident(t.table_schema) || '.' || quote_ident(t.table_name) || ' (' || E'\n' || string_agg(
        '  ' || quote_ident(c.column_name) || ' ' || c.data_type || CASE
          WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')'
          ELSE ''
        END || CASE
          WHEN c.is_nullable = 'NO' THEN ' NOT NULL'
          ELSE ''
        END || CASE
          WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default
          ELSE ''
        END,
        E',\n'
        ORDER BY
          c.ordinal_position
      ) || E'\n);' AS def
    FROM
      information_schema.tables t
      JOIN information_schema.columns c ON c.table_schema = t.table_schema
      AND c.table_name = t.table_name
    WHERE
      t.table_schema = '{schema}'
      AND t.table_name = '{name}'
    GROUP BY
      t.table_schema,
      t.table_name
  ),
  index_def AS (
    SELECT
      string_agg(indexdef || ';', E'\n') AS idx_def
    FROM
      pg_indexes
    WHERE
      schemaname = '{schema}'
      AND tablename = '{name}'
  )
SELECT
  (
    SELECT
      def
    FROM
      table_def
  ) || COALESCE(
    E'\n\n' || (
      SELECT
        idx_def
      FROM
        index_def
      WHERE
        idx_def IS NOT NULL
    ),
    ''
  ) AS ddl;