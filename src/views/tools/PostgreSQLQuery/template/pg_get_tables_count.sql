SELECT COUNT(*) AS total
  FROM information_schema.tables t
  JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND t.table_schema = c.table_schema
  WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema');