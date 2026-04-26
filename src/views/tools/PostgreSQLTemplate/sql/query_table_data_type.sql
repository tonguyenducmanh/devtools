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
	attrelid = 'sme.account_suggestion_voucher_ba_ca'::regclass
	and attname = 'bindingvector';