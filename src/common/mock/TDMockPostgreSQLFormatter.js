export const TDMockPostgreSQLFormatter = {
  inputSource: `-- sample code comment
    /*
    * sample row code comment
    */
    select customer_id, customer_code, customer_name from public.customer ao1 where (customer_id is not null and customer_code = 'tdmanh' or (select 1 from public.user_collection mu2 order by created desc group by modified having total >= 0) and 1 = 1) or customer_type = 1;



    select * from public.voucher_stored gv3;

    select mu.email from public.user_collection mu
    where mu.user_id in
    (
    select mujr.user_id from public.user_collection_join_role mujr where role_id ='c4908208-d527-4b9e-b216-e8fb4fb26a1d'
    );

    -- query danh sách email nhắc nhở
    select * from public.email_sent_remind where company_id ='';

    -- query lập lịch gửi email
    select * from public.report_submission_schedule_config where refid = '';
    -- query size của db
    SELECT pg_database_size(pd.datname)/1024/1024 AS size_in_mb
                                FROM pg_database pd where pd.datname = current_database();

    -- query user email
    select
                                    vtdu.company_id,
    vtdu.company_name ,
    vtdu.email ,
    max(vtdu.full_name) as full_name
                                from
    public.view_company_database_user vtdu
                                where
    vtdu.company_id = any(:p_company_checks)
    and vtdu.amis_role_type in (1, 2)
                                group by
                                    vtdu.company_id,
    vtdu.company_name ,
    vtdu.email;

    select
    ou2.partner_platform_id as partner_platform_id,
    ou.partner_platform_id as branch_id
                            from
    public.org_info ou
                            join public.org_info ou2 on
    ou2.org_info_id = ou.branch_id
                            where
    ou.partner_platform_id = any(:p_org_ids);


    -- thông tin vật tư mapping
    select
        smis.item_id_tiki,
        smis.model_id_tiki,
        smis.product_id,
        smis.product_code,
        smis.product_name,
        ii.is_customized,
        ii.tax_rate,
        ii.other_vat_rate,
        smis.tier_variation1,
        smis.tier_variation2,
        smis.tier_group_name1,
        smis.tier_group_name2,
        smis.unit_id,
        smis.unit_name,
        smis.is_model_detail,
        ii.unit_list,
        ii.unit_id as main_unit_id,
        ii.unit_name as main_unit_name
    from
        public.setting_mapping smis
    left join public.tiki_connection_info sci
        on sci.connection_id = smis.connection_id
    left join public.product ii
        on ii.product_id = smis.product_id
    where
        sci.shop_id = :p_shop_id
        and smis.item_id_tiki = any(:p_item_ids);`,
};
