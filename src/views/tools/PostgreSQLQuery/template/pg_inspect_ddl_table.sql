WITH
  table_def AS (
    SELECT
      'CREATE TABLE IF NOT EXISTS ' || quote_ident(t.table_schema) || '.' || quote_ident(t.table_name) || ' (' || E'\n' || string_agg(
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
      ) || COALESCE(
        (
          SELECT
            E',\n  CONSTRAINT ' || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid)
          FROM
            pg_constraint con
            JOIN pg_class cl ON con.conrelid = cl.oid
            JOIN pg_namespace ns ON cl.relnamespace = ns.oid
          WHERE
            ns.nspname = t.table_schema
            AND cl.relname = t.table_name
            AND con.contype = 'p'
        ),
        ''
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
  constraint_def AS (
    SELECT
      string_agg(
        'DO $$' || E'\n' || 'BEGIN' || E'\n' || '    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ' || quote_literal(con.conname) || ' AND conrelid = ' || quote_literal(
          quote_ident(n.nspname) || '.' || quote_ident(c.relname)
        ) || '::regclass) THEN' || E'\n' || '        ALTER TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' ADD CONSTRAINT ' || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid) || ';' || E'\n' || '    END IF;' || E'\n' || 'END $$;',
        E'\n\n'
      ) AS cons_def
    FROM
      pg_constraint con
      JOIN pg_class c ON con.conrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE
      n.nspname = '{schema}'
      AND c.relname = '{name}'
      AND con.contype IN ('f', 'u', 'c')
  ),
  index_def AS (
    SELECT
      string_agg(
        regexp_replace(
          pg_get_indexdef(i.indexrelid),
          '^(CREATE (?:UNIQUE )?INDEX) ',
          '\1 IF NOT EXISTS '
        ) || ';',
        E'\n'
      ) AS idx_def
    FROM
      pg_index i
      JOIN pg_class c ON i.indrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE
      n.nspname = '{schema}'
      AND c.relname = '{name}'
      -- Loại bỏ các index sinh ra từ constraint (PK, Unique)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          pg_constraint con
        WHERE
          con.conrelid = c.oid
          AND con.conindid = i.indexrelid
      )
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
        cons_def
      FROM
        constraint_def
      WHERE
        cons_def IS NOT NULL
    ),
    ''
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
  ) AS ddl
LIMIT
  1;