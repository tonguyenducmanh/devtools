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
  {
    key: "query_function_body",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionBody",
    sql: sqlModules["./sql/query_function_body.sql"],
  },
  {
    key: "query_function_contain",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionContain",
    sql: sqlModules["./sql/query_function_contain.sql"],
  },
  {
    key: "query_size_db",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeDb",
    sql: sqlModules["./sql/query_size_db.sql"],
  },
  {
    key: "query_size_table",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeTable",
    sql: sqlModules["./sql/query_size_table.sql"],
  },
  {
    key: "query_table_data_type",
    labelKey: "i18nCommon.postgreSQLTemplate.queryTableDataType",
    sql: sqlModules["./sql/query_table_data_type.sql"],
  },
  {
    key: "query_view_definition",
    labelKey: "i18nCommon.postgreSQLTemplate.queryViewDefinition",
    sql: sqlModules["./sql/query_view_definition.sql"],
  },
];
