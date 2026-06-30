SELECT 
    pg_size_pretty(
        pg_total_relation_size(
            'schema.your_table_name'
        )
    ) 
limit 1;