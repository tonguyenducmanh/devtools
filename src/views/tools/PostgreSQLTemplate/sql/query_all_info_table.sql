--query danh sách cột của bảng
select
    c.column_name || ',',
    'l.' || c.column_name || ',',
    c.column_name
    || ' ' || c.data_type
    || case when c.is_nullable = 'NO' then ' not null' else '' end
    || case when c.column_default is not null then ' default ' || c.column_default else '' end
    || ',',
    'COMMENT ON COLUMN ' || c.table_schema || '.' || c.table_name || '.' || c.column_name || ' IS ''' || coalesce(d.description,'') || ''';',
    c.*
FROM information_schema.columns as c
left join pg_catalog.pg_statio_all_tables as t on c.table_name = t.relname and c.table_schema = t.schemaname
left join pg_catalog.pg_description as d on d.objoid = t.relid and d.objsubid = c.ordinal_position
WHERE (c.table_schema, c.table_name) = ('public','your_table_name')
order by c.ordinal_position
LIMIT 10;