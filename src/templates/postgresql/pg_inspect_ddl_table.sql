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
      ) || E'\n)' || COALESCE(
        E'\nWITH (' || array_to_string(c.reloptions, ', ') || ')',
        ''
      ) || ';' AS def
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
      c.relname,
      c.reloptions
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
  ),
  trigger_def AS (
    SELECT
      string_agg(
        'DROP TRIGGER IF EXISTS ' || quote_ident(tg.tgname) || ' ON ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ';' || E'\n' ||
        pg_get_triggerdef(tg.oid) || ';',
        E'\n\n'
      ) AS trg_def
    FROM
      pg_trigger tg
      JOIN pg_class c ON tg.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE
      n.nspname = '{schema}'
      AND c.relname = '{name}'
      AND NOT tg.tgisinternal
  ),
  sequence_def AS (
    SELECT
      string_agg(
        'CREATE SEQUENCE IF NOT EXISTS ' || quote_ident(n.nspname) || '.' || quote_ident(s.relname) ||
        ' AS ' || format_type(a.atttypid, a.atttypmod) ||
        ' START WITH ' || COALESCE(sq.seqstart, 1)::text ||
        ' INCREMENT BY ' || COALESCE(sq.seqincrement, 1)::text ||
        CASE WHEN sq.seqcycle THEN ' CYCLE' ELSE ' NO CYCLE' END || ';' || E'\n' ||
        'ALTER SEQUENCE ' || quote_ident(n.nspname) || '.' || quote_ident(s.relname) ||
        ' OWNED BY ' || quote_ident(tn.nspname) || '.' || quote_ident(t.relname) || '.' || quote_ident(a.attname) || ';',
        E'\n\n'
      ) AS seq_def
    FROM
      pg_class s
      JOIN pg_namespace n ON s.relnamespace = n.oid
      JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
      JOIN pg_class t ON d.refobjid = t.oid
      JOIN pg_namespace tn ON t.relnamespace = tn.oid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
      LEFT JOIN pg_sequence sq ON sq.seqrelid = s.oid
    WHERE
      tn.nspname = '{schema}'
      AND t.relname = '{name}'
      AND s.relkind = 'S'
  ),
  comment_def AS (
    SELECT
      string_agg(
        'COMMENT ON ' || com_type || ' ' || com_object || ' IS ' || quote_literal(com_text) || ';',
        E'\n\n'
      ) AS comm_def
    FROM (
      SELECT
        'TABLE' AS com_type,
        quote_ident(n.nspname) || '.' || quote_ident(c.relname) AS com_object,
        pg_catalog.obj_description(c.oid, 'pg_class') AS com_text
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = '{schema}' AND c.relname = '{name}'
        AND pg_catalog.obj_description(c.oid, 'pg_class') IS NOT NULL
      UNION ALL
      SELECT
        'COLUMN' AS com_type,
        quote_ident(n.nspname) || '.' || quote_ident(c.relname) || '.' || quote_ident(a.attname) AS com_object,
        pg_catalog.col_description(a.attrelid, a.attnum) AS com_text
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE n.nspname = '{schema}' AND c.relname = '{name}'
        AND a.attnum > 0 AND NOT a.attisdropped
        AND pg_catalog.col_description(a.attrelid, a.attnum) IS NOT NULL
    ) comments
  )
SELECT
  (
    SELECT
      '-- Create table script' || E'\n' ||
      def
    FROM
      table_def
  ) || COALESCE(
    E'\n\n' || (
      SELECT
        '-- Constraint scripts' || E'\n' ||
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
        '-- Index scripts' || E'\n' ||
        idx_def
      FROM
        index_def
      WHERE
        idx_def IS NOT NULL
    ),
    ''
  ) || COALESCE(
    E'\n\n' || (
      SELECT
        '-- Trigger scripts' || E'\n' ||
        trg_def
      FROM
        trigger_def
      WHERE
        trg_def IS NOT NULL
    ),
    ''
  ) || COALESCE(
    E'\n\n' || (
      SELECT
        '-- Sequence scripts' || E'\n' ||
        seq_def
      FROM
        sequence_def
      WHERE
        seq_def IS NOT NULL
    ),
    ''
  ) || COALESCE(
    E'\n\n' || (
      SELECT
        '-- Comment scripts' || E'\n' ||
        comm_def
      FROM
        comment_def
      WHERE
        comm_def IS NOT NULL
    ),
    ''
  ) AS ddl
LIMIT
  1;