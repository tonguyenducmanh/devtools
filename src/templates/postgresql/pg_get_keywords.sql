SELECT
  word,
  catcode,
  catdesc
FROM
  pg_get_keywords()
ORDER BY
  word
limit
  1000;