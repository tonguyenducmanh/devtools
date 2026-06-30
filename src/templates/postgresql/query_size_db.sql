SELECT 
    pg_database_size(pd.datname)/1024/1024 AS size_in_mb
FROM 
    pg_database pd where pd.datname = current_database() 
limit 1;