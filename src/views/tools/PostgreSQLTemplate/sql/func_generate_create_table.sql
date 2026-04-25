DROP FUNCTION IF EXISTS public.func_generate_create_table(p_schema_query text, p_table_query text, p_schema_result text, p_table_result text);
CREATE OR REPLACE FUNCTION public.func_generate_create_table(
    p_schema_query text, p_table_query text, p_schema_result text, p_table_result text
)
RETURNS text
AS $$
-- function build ra câu create table theo cấu trúc 1 bảng có sẵn
-- script chạy thử
-- select
-- 	*
-- from
-- 	public.func_generate_create_table(
--     p_schema_query :='led',
-- 	p_table_query :='inventory_ledger',
-- 	p_schema_result :='led',
-- 	p_table_result :='inventory_ledger'
-- )
DECLARE
    v_table_result text;
    v_result text;
BEGIN
    if p_schema_query is not null and p_table_query is not null THEN
        if p_schema_result is not null and p_table_result is not null THEN
            -- tạo tên bảng đích
            select
                p_schema_result || '.' || p_table_result
            into
                v_table_result;
        else
            -- tạo tên bảng nguồn
            select
                p_schema_query || '.' || p_table_query
            into
                v_table_result;
        end if;

        -- tạo bảng tạm lưu danh sách các cấu trúc cột của bảng thật

        drop table if exists tmp_table_structure;
        create temp table if not exists tmp_table_structure(
            column_declare text
        );

        insert into tmp_table_structure( 
            column_declare
        )
        select
        -- query ra cấu trúc của từng cột của 1 bảng
            c.column_name
            || ' ' || c.data_type
            || 
                case 
                    when c.is_nullable = 'NO' 
                        then ' not null'
                    else 
                        ''
                end
            || 
                case 
                    when c.column_default is not null then 
                        ' default ' || c.column_default
                    else 
                        ''
                END
            as column_declare
        FROM 
            information_schema.columns as c
        WHERE 
            -- query theo schema và bảng nào
            (c.table_schema, c.table_name) = (p_schema_query, p_table_query)
        order by 
            c.ordinal_position
        ;

        if (select count(1) from tmp_table_structure) > 0 then
            select 
                'CREATE TABLE IF NOT EXISTS '
                || v_table_result
                || ' ( '
                || STRING_AGG(
                    tts.column_declare,
                    ' , '
                )
                || ' );'
            from 
                tmp_table_structure tts
            into 
                v_result;
        end if;
        
    end if;

    return v_result;
END;
$$ LANGUAGE plpgsql;