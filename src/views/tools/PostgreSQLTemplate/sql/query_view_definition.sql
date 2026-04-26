-- query nội dung view
SELECT
    table_name AS view_name,
    view_definition AS definition
FROM
    information_schema.views
WHERE
    table_name = 'your_view_name'
    AND table_schema = 'your_schema_name'
LIMIT 10;