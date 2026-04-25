// cấu hình import sql từ file raw
const sqlModules = import.meta.glob("./sql/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "func_generate_create_table",
    labelKey: "i18nCommon.postgreSQLTemplate.funcGenerateCreateTable",
    sql: sqlModules["./sql/func_generate_create_table.sql"],
  },
  {
    key: "query_all_info_table",
    labelKey: "i18nCommon.postgreSQLTemplate.queryAllInfoTable",
    sql: sqlModules["./sql/query_all_info_table.sql"],
  },
];
