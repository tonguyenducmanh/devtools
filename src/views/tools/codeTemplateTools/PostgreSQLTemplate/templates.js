// cấu hình import sql từ file raw
const sqlModules = import.meta.glob("./template/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "func_generate_create_table",
    labelKey: "i18nCommon.postgreSQLTemplate.funcGenerateCreateTable",
    sql: sqlModules["./template/func_generate_create_table.sql"],
  },
  {
    key: "query_all_info_table",
    labelKey: "i18nCommon.postgreSQLTemplate.queryAllInfoTable",
    sql: sqlModules["./template/query_all_info_table.sql"],
  },
  {
    key: "query_function_body",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionBody",
    sql: sqlModules["./template/query_function_body.sql"],
  },
  {
    key: "query_function_contain",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionContain",
    sql: sqlModules["./template/query_function_contain.sql"],
  },
  {
    key: "query_size_db",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeDb",
    sql: sqlModules["./template/query_size_db.sql"],
  },
  {
    key: "query_size_table",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeTable",
    sql: sqlModules["./template/query_size_table.sql"],
  },
  {
    key: "query_table_data_type",
    labelKey: "i18nCommon.postgreSQLTemplate.queryTableDataType",
    sql: sqlModules["./template/query_table_data_type.sql"],
  },
  {
    key: "query_view_definition",
    labelKey: "i18nCommon.postgreSQLTemplate.queryViewDefinition",
    sql: sqlModules["./template/query_view_definition.sql"],
  },
  {
    key: "query_running_queries",
    labelKey: "i18nCommon.postgreSQLTemplate.queryRunningQueries",
    sql: sqlModules["./template/query_running_queries.sql"],
  },
  {
    key: "query_kill_process",
    labelKey: "i18nCommon.postgreSQLTemplate.queryKillProcess",
    sql: sqlModules["./template/query_kill_process.sql"],
  },
];
