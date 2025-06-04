/**
 * file chứa toàn bộ mock data cho từng file vue để test
 * đảm bảo rằng các trường trong từng object mock phải được khai báo trong file vue tương ứng ở phần data
 */

export const compareCodeMock = {
  firstCodeFile: `<template>\n  <div class="td-input" :class="{ 'flex-col': isLabelTop }">\n\n\n\n    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">\n      {{ label }}\n    </div>\n    <input\n      :placeholder="placeHolder"\n      :value="modelValue"\n      @input="changeInputValue"\n      :disabled="readOnly"\n    />\n    <slot></slot>\n  </div>\n</template>\n\n\x3Cscript>\nimport _ from "@/common/TDUtility.js";\n\nexport default {\n  name: "TDInput",\n  created() {},\n  mounted() {},\n  methods: {},\n  props: {\n    placeHolder: {\n      type: String,\n      default: "Nhập giá trị",\n    },\n    modelValue: {\n      type: String,\n      default: null,\n    },\n    readOnly: {\n      type: Boolean,\n      default: false,\n    },\n    label: {\n      type: String,\n      default: null,\n    },\n    isLabelTop: {\n      type: Boolean,\n      default: false,\n    },\n  },\n  data() {\n    return {\n      value: null,\n    };\n  },\n  watch: {},\n  methods: {\n    changeInputValue(e) {\n      let me = this;\n      me.$emit("update:modelValue", e.target.value);\n    },\n  },\n};\n\x3C/script>\n<style lang="scss" scoped>\n.td-input {\n  display: flex;\n  height: 100%;\n  width: 100%;\n  align-items: center;\n  margin: var(--padding);\n  .td-label {\n    overflow-wrap: normal; /* Allows breaking long words */\n    word-break: keep-all; /* For wider browser support */\n    white-space: nowrap; /* Ensure wrapping is enabled */\n    padding-right: var(--padding);\n  }\n  .td-label-top {\n    padding-bottom: var(--padding);\n  }\n  input {\n    border: 2px solid var(--border-color);\n    width: 100%;\n    padding: var(--padding);\n    border-radius: var(--border-radius);\n    background-color: var(--bg-sub-color);\n    color: var(--text-primary-color);\n  }\n\n  input:focus {\n    outline: none;\n    border: 2px solid var(--focus-color);\n  }\n}\n\n\n\n</style>`,
  secondCodeFile: `<template>\n  <div\n    class="td-input"\n    :class="{ 'flex-col': isLabelTop, 'td-input-read-only': readOnly }"\n  >\n    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">\n      {{ label }}\n    </div>\n    <input\n      :placeholder="placeHolder"\n      :value="modelValue"\n      @input="changeInputValue"\n      :disabled="readOnly"\n    />\n    <slot></slot>\n  </div>\n</template>\n\n\x3Cscript>\nimport _ from "@/common/TDUtility.js";\n\nexport default {\n  name: "TDInput",\n  created() {},\n  mounted() {},\n  methods: {},\n  props: {\n    placeHolder: {\n      type: String,\n      default: "Nhập giá trị",\n    },\n    modelValue: {\n      type: String,\n      default: null,\n    },\n    readOnly: {\n      type: Boolean,\n      default: false,\n    },\n    label: {\n      type: String,\n      default: null,\n    },\n    isLabelTop: {\n      type: Boolean,\n      default: false,\n    },\n  },\n  data() {\n    return {\n      value: null,\n    };\n  },\n  watch: {},\n  methods: {\n    changeInputValue(e) {\n      let me = this;\n      me.$emit("update:modelValue", e.target.value);\n    },\n  },\n};\n\x3C/script>\n<style lang="scss" scoped>\n.td-input {\n  display: flex;\n  height: 100%;\n  width: 100%;\n  align-items: center;\n  margin: var(--padding);\n  .td-label {\n    overflow-wrap: normal; /* Allows breaking long words */\n    word-break: keep-all; /* For wider browser support */\n    white-space: nowrap; /* Ensure wrapping is enabled */\n    padding-right: var(--padding);\n  }\n  .td-label-top {\n    padding-bottom: var(--padding);\n  }\n  input {\n    border: 2px solid var(--border-color);\n    width: 100%;\n    padding: var(--padding);\n    border-radius: var(--border-radius);\n    background-color: var(--bg-main-color);\n    color: var(--text-primary-color);\n  }\n\n  input:focus {\n    outline: none;\n    border: 2px solid var(--focus-color);\n  }\n}\n.td-input-read-only input {\n  background-color: var(--bg-sub-color);\n}\n</style>`,
};

export const downloadVSCodeExtMock = {
  itemName: "GitHub.copilot-chat",
  version: "0.27.2025050203",
};

export const JSONToPostgreSQLMock = {
  tableName: "customer",
  schemaName: "public",
  primaryKeyField: "customer_id",
  inputJSON:
    '{"customer_id":"65205f0c-033e-4fd4-ae2d-9f8765309909", "customer_code":"tomanh", "customer_name":"Anh Mạnh"}',
};

export const mappingJSONMock = {
  originalObjectText: '{"a":123,"b":"221","c":{"d":"abaac","e":"12315"}}',
  targetObjectText: '{"a":123,"b":"2212"}',
};

export const base64ToImageMock = {
  base64Result:
    "data:image/jpeg;base64,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",
};

export const textToQRCodeMock = {
  textGenQR:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
};

export const TDJSONParserMock = {
  jsonSource:
    '"{\\"order_id\\":\\"OD-789-UVW-012\\",\\"order_date\\":\\"2025-05-06\\",\\"customer_info\\":{\\"customer_name\\":\\"Tran Thi Bich\\",\\"customer_email\\":\\"bich.tran@sample.vn\\"},\\"product_details\\":\\"[{\\\\\\"product_code\\\\\\": \\\\\\"PROD-A1\\\\\\", \\\\\\"quantity\\\\\\": 2, \\\\\\"price\\\\\\": 25.50}, {\\\\\\"product_code\\\\\\": \\\\\\"PROD-B2\\\\\\", \\\\\\"quantity\\\\\\": 1, \\\\\\"price\\\\\\": 49.99}]\\",\\"total_amount\\":100.99,\\"shipping_address\\":\\"456 Nguyen Trai, Ward 5, District 5, Ho Chi Minh City\\"}"',
  objectSource: null,
  jsonSelected: null,
};

export const TDJSONToExcel = {
  jsonSource:
    '[{"id":1,"name":"Nguyễn Văn A","contact":{"email":"a@gmail.com","phone":"0123"},"tags":["nhân viên","full-time"]},{"id":2,"name":"Trần Thị B","contact":{"email":"b@gmail.com","phone":"0456"},"tags":["quản lý"]}]',
};

export const TDTextCompress = {
  inputSource:
    '{"Data":"{\\"ValidateInfo\\":[],\\"Success\\":true,\\"Code\\":0,\\"SubCode\\":1,\\"UserMessage\\":\\"\\",\\"SystemMessage\\":null,\\"Data\\":{\\"ConnectedSyncID\\":\\"85355b03-824b-4df2-bbd0-f4f0a128eecf\\",\\"ConnectedSyncIDOld\\":null,\\"UserID\\":\\"73ddd5b8-c580-43f7-bd87-0de5b49ef892\\",\\"EmployeeCode\\":null,\\"FullName\\":null,\\"ActionCode\\":\\"RequestBillApproval\\",\\"AppCode\\":\\"APU\\",\\"ListProcess\\":[{\\"ProcessURL\\":\\"/process/execute/1?ID=369569&type=1&status=0&appCode=AMISProcess&companyCode=rwduneto&isIFrame=true\\",\\"Note\\":null,\\"UserInfo\\":{\\"UserID\\":\\"73ddd5b8-c580-43f7-bd87-0de5b49ef892\\",\\"EmployeeID\\":null,\\"UserName\\":\\"hr@htsb.vn\\",\\"FullName\\":\\"NGUYỄN THỊ THANH\\",\\"FirstName\\":\\"NGUYỄN THỊ\\",\\"LastName\\":\\"THANH\\",\\"Email\\":\\"hr@htsb.vn\\",\\"Mobile\\":\\"978931811\\",\\"OrganizationUnitID\\":\\"56495e9a-1faa-4031-a9a7-0a2d0fee7111\\",\\"OrganizationUnitName\\":\\"Phòng hành chính nhân sự\\",\\"GroupID\\":null,\\"ListGroupID\\":null,\\"ListGroupName\\":null,\\"IsChangedGroup\\":false,\\"GroupName\\":null,\\"Status\\":3,\\"Avatar\\":null,\\"RoleID\\":null,\\"RoleName\\":null,\\"Birthday\\":null,\\"Gender\\":null,\\"Address\\":null,\\"IsStaff\\":true,\\"IsDeleted\\":false,\\"IsUser\\":true,\\"EmployeeCode\\":\\"HT041920229\\",\\"JobPositionName\\":\\"Trưởng Phòng\\",\\"JobPositionID\\":\\"3f51245f-7feb-45cc-9bfa-dadf37a53d7c\\",\\"EmployeeStatus\\":1,\\"OfficeEmail\\":\\"hr@htsb.vn\\",\\"ContactEmail\\":\\"hr@htsb.vn\\",\\"MISACode\\":null,\\"RoleDetails\\":null,\\"OrganizationPath\\":null,\\"ReportToID\\":null,\\"ReportToName\\":null,\\"JobTitleID\\":\\"9bcf803a-16bf-11f0-8aa8-005056b2b21e\\",\\"JobTitleName\\":\\"Trưởng phòng\\",\\"JobGroupID\\":null,\\"UserGroupID\\":null,\\"OfficeID\\":null,\\"OfficeName\\":null,\\"OrganizationUnitOfficeCode\\":null,\\"OrganizationUnitOfficeID\\":null,\\"OrganizationUnitOfficeName\\":null,\\"TenantID\\":\\"c99c4ef5-ec28-4f85-8693-bcca7777d179\\",\\"CreatedDate\\":\\"2025-05-28T16:34:34.890+07:00\\",\\"CreatedBy\\":null,\\"ModifiedDate\\":\\"2025-05-28T16:34:34.890+07:00\\",\\"ModifiedBy\\":null,\\"EditVersion\\":null,\\"State\\":0,\\"OldData\\":null,\\"PassWarningCode\\":null},\\"UserAccepted\\":[],\\"ActionType\\":1,\\"CurrentStep\\":null,\\"EmployeeCode\\":null,\\"ProcessExecutionID\\":369569,\\"ProcessExecutionCode\\":null,\\"ProcessExecutionTitle\\":\\"Quy trình phê duyệt Đơn mua hàng của NGUYỄN THỊ THANH\\",\\"Status\\":0,\\"CreatorID\\":\\"73ddd5b8-c580-43f7-bd87-0de5b49ef892\\",\\"CreatorName\\":\\"NGUYỄN THỊ THANH\\",\\"CreatorOrgName\\":\\"Phòng hành chính nhân sự\\",\\"CreatorOrgID\\":\\"56495e9a-1faa-4031-a9a7-0a2d0fee7111\\",\\"PublishDate\\":\\"2025-05-28T09:34:34.000+07:00\\",\\"Data\\":null,\\"DataReturn\\":{\\"VoucherRefNo\\":\\"DMH555555\\",\\"VoucherType\\":\\"\\",\\"UserID\\":[{\\"UserID\\":\\"73ddd5b8-c580-43f7-bd87-0de5b49ef892\\",\\"EmployeeID\\":null,\\"UserName\\":\\"hr@htsb.vn\\",\\"FullName\\":\\"NGUYỄN THỊ THANH\\",\\"FirstName\\":\\"NGUYỄN THỊ\\",\\"LastName\\":\\"THANH\\",\\"Email\\":\\"hr@htsb.vn\\",\\"Mobile\\":\\"978931811\\",\\"OrganizationUnitID\\":\\"56495e9a-1faa-4031-a9a7-0a2d0fee7111\\",\\"OrganizationUnitName\\":\\"Phòng hành chính nhân sự\\",\\"GroupID\\":null,\\"ListGroupID\\":null,\\"ListGroupName\\":null,\\"IsChangedGroup\\":false,\\"GroupName\\":null,\\"Status\\":3,\\"Avatar\\":null,\\"RoleID\\":null,\\"RoleName\\":null,\\"Birthday\\":null,\\"Gender\\":null,\\"Address\\":null,\\"IsStaff\\":true,\\"IsDeleted\\":false,\\"IsUser\\":true,\\"EmployeeCode\\":\\"HT041920229\\",\\"JobPositionName\\":\\"Trưởng Phòng\\",\\"JobPositionID\\":\\"3f51245f-7feb-45cc-9bfa-dadf37a53d7c\\",\\"EmployeeStatus\\":1,\\"OfficeEmail\\":\\"hr@htsb.vn\\",\\"ContactEmail\\":\\"hr@htsb.vn\\",\\"MISACode\\":null,\\"RoleDetails\\":null,\\"OrganizationPath\\":\\"Phòng hành chính nhân sự\\",\\"ReportToID\\":null,\\"ReportToName\\":null,\\"JobTitleID\\":\\"9bcf803a-16bf-11f0-8aa8-005056b2b21e\\",\\"JobTitleName\\":\\"Trưởng phòng\\",\\"JobGroupID\\":null,\\"UserGroupID\\":null,\\"OfficeID\\":null,\\"OfficeName\\":null,\\"OrganizationUnitOfficeCode\\":null,\\"OrganizationUnitOfficeID\\":null,\\"OrganizationUnitOfficeName\\":null,\\"TenantID\\":\\"c99c4ef5-ec28-4f85-8693-bcca7777d179\\",\\"CreatedDate\\":\\"2025-05-28T16:34:34.028+07:00\\",\\"CreatedBy\\":null,\\"ModifiedDate\\":\\"2025-05-28T16:34:34.028+07:00\\",\\"ModifiedBy\\":null,\\"EditVersion\\":null,\\"State\\":0,\\"OldData\\":null,\\"PassWarningCode\\":null}],\\"OrganizationUnitID\\":[{\\"OrganizationUnitID\\":\\"56495e9a-1faa-4031-a9a7-0a2d0fee7111\\",\\"OrganizationUnitCode\\":\\"HR\\",\\"OrganizationUnitName\\":\\"Phòng hành chính nhân sự\\",\\"OrganizationUnitParentsName\\":\\"Phòng hành chính nhân sự\\",\\"OrganizationPath\\":null}],\\"VoucherPurpose\\":\\"\\",\\"DeliverDeadline\\":null,\\"DeliveryAddress\\":\\"\\",\\"VoucherPrintTemplate\\":[{\\"FileID\\":\\"c3362148-493b-443c-bcb1-bb1edc355846.pdf\\",\\"FileName\\":\\"Purchase OrderVAT_Soluong_PDF DMH555555.pdf\\",\\"FileSize\\":141005,\\"FileType\\":\\".pdf\\",\\"DownloadURL\\":\\"http://storage.misaonline.local:32469/amis-platform/rwduneto/process/fileattachment/c3362148-493b-443c-bcb1-bb1edc355846.pdf?AWSAccessKeyId=amisplatform&Expires=1748425475&Signature=sAZ%2Fkfr93rJSHRYogp9I%2Bw7pLa4%3D\\"}],\\"FilePrint\\":[]},\\"ConnectedInfoJSON\\":\\"\\"}],\\"TenantID\\":\\"c99c4ef5-ec28-4f85-8693-bcca7777d179\\",\\"CreatedDate\\":\\"2025-05-28T16:34:34.147+07:00\\",\\"CreatedBy\\":null,\\"ModifiedDate\\":\\"2025-05-28T16:34:34.147+07:00\\",\\"ModifiedBy\\":null,\\"EditVersion\\":null,\\"State\\":0,\\"OldData\\":null,\\"PassWarningCode\\":null},\\"GetLastData\\":true,\\"ServerTime\\":\\"2025-05-28T16:34:34.890+07:00\\"}"}',
};

export const TDPostgreSQLFormatter = {
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
    )

    -- query danh sách email nhắc nhở
    select * from public.email_sent_remind where company_id ='';

    -- query lập lịch gửi email
    select * from public.report_submission_schedule_config where refid = ''
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
