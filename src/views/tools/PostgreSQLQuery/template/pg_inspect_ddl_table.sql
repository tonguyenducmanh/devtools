WITH
  table_def AS (
    SELECT
      'CREATE TABLE IF NOT EXISTS ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' (' || E'\n' || string_agg(
        '  ' || quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod) || CASE
          WHEN a.attnotnull THEN ' NOT NULL'
          ELSE ' NULL'
        END || COALESCE(
          ' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid),
          ''
        ),
        E',\n'
        ORDER BY a.attnum
      ) || COALESCE(
        (
          SELECT
            E',\n  CONSTRAINT ' || quote_ident(con.conname) || ' ' || pg_get_constraintdef(con.oid)
          FROM
            pg_constraint con
            JOIN pg_class cl ON con.conrelid = cl.oid
            JOIN pg_namespace ns ON cl.relnamespace = ns.oid
          WHERE
            ns.nspname = n.nspname
            AND cl.relname = c.relname
            AND con.contype = 'p'
        ),
        ''
      ) || E'\n);' AS def
    FROM
      pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_attribute a ON a.attrelid = c.oid
      LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
    WHERE
      n.nspname = '{schema}'
      AND c.relname = '{name}'
      AND a.attnum > 0
      AND NOT a.attisdropped
    GROUP BY
      n.nspname,
      c.relname
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