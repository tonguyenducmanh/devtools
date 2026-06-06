// cấu hình import sql từ file raw
const codeModules = import.meta.glob("./template/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "func_generate_create_table",
    labelKey: "i18nCommon.postgreSQLTemplate.funcGenerateCreateTable",
    code: codeModules["./template/func_generate_create_table.sql"],
  },
  {
    key: "query_all_info_table",
    labelKey: "i18nCommon.postgreSQLTemplate.queryAllInfoTable",
    code: codeModules["./template/query_all_info_table.sql"],
  },
  {
    key: "query_function_body",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionBody",
    code: codeModules["./template/query_function_body.sql"],
  },
  {
    key: "query_function_contain",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionContain",
    code: codeModules["./template/query_function_contain.sql"],
  },
  {
    key: "query_size_db",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeDb",
    code: codeModules["./template/query_size_db.sql"],
  },
  {
    key: "query_size_table",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeTable",
    code: codeModules["./template/query_size_table.sql"],
  },
  {
    key: "query_table_data_type",
    labelKey: "i18nCommon.postgreSQLTemplate.queryTableDataType",
    code: codeModules["./template/query_table_data_type.sql"],
  },
  {
    key: "query_view_definition",
    labelKey: "i18nCommon.postgreSQLTemplate.queryViewDefinition",
    code: codeModules["./template/query_view_definition.sql"],
  },
  {
    key: "query_running_queries",
    labelKey: "i18nCommon.postgreSQLTemplate.queryRunningQueries",
    code: codeModules["./template/query_running_queries.sql"],
  },
  {
    key: "query_kill_process",
    labelKey: "i18nCommon.postgreSQLTemplate.queryKillProcess",
    code: codeModules["./template/query_kill_process.sql"],
  },
];
