-- query size của 1 table
SELECT 
    pg_size_pretty(
        pg_total_relation_size(
            'sme.account_suggestion_voucher_ba_ca'
        )
    ) 
limit 1;