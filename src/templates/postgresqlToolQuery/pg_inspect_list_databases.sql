SELECT
  datname AS database_name
FROM
  pg_database
WHERE
  datistemplate = false
ORDER BY
  datname;
