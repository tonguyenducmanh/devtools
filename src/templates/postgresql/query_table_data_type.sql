-- query kiểu dữ liệu của cột trong bảng
select
	attname,
	atttypmod,
	format_type(atttypid,
	atttypmod) ,
	*
from
	pg_attribute
where
	attrelid = 'public.your_table'::regclass
	and attname = 'your_column_name'
LIMIT 10;
