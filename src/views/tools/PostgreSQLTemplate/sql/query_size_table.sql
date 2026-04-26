-- query size của 1 table
SELECT 
    pg_size_pretty(
        pg_total_relation_size(
            'public.your_table_name'
        )
    ) 
limit 1;