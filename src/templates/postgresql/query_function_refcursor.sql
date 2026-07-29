-- demo việc chạy query function trả về refcursor trong postgresql
BEGIN;

select * from td.func_get_report_by_customer(
  p_customer_id => '71298ca7-1d6f-409a-8110-aa13b54f0491'::uuid,
  p_tenant_id => '8ca56131-ca8c-48d5-a43e-767ca9657909'::uuid
) figlnbi;

-- có bao nhiêu refcursor được trả về thì fetch all bấy nhiêu
FETCH ALL IN "<unnamed portal 1>";   -- (ref1)
FETCH ALL IN "<unnamed portal 2>";   -- (ref2)

COMMIT;

