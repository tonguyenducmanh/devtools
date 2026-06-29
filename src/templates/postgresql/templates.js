// cấu hình import sql từ file raw
const codeModules = import.meta.glob("./*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "query_size_db",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeDb",
    code: codeModules["./query_size_db.sql"],
  },
  {
    key: "query_size_table",
    labelKey: "i18nCommon.postgreSQLTemplate.querySizeTable",
    code: codeModules["./query_size_table.sql"],
  },
  {
    key: "func_generate_create_table",
    labelKey: "i18nCommon.postgreSQLTemplate.funcGenerateCreateTable",
    code: codeModules["./func_generate_create_table.sql"],
  },
  {
    key: "query_all_info_table",
    labelKey: "i18nCommon.postgreSQLTemplate.queryAllInfoTable",
    code: codeModules["./query_all_info_table.sql"],
  },
  {
    key: "query_function_body",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionBody",
    code: codeModules["./query_function_body.sql"],
  },
  {
    key: "query_function_contain",
    labelKey: "i18nCommon.postgreSQLTemplate.queryFunctionContain",
    code: codeModules["./query_function_contain.sql"],
  },
  {
    key: "query_table_data_type",
    labelKey: "i18nCommon.postgreSQLTemplate.queryTableDataType",
    code: codeModules["./query_table_data_type.sql"],
  },
  {
    key: "query_view_definition",
    labelKey: "i18nCommon.postgreSQLTemplate.queryViewDefinition",
    code: codeModules["./query_view_definition.sql"],
  },
  {
    key: "get_all_index_definition",
    labelKey: "i18nCommon.postgreSQLTemplate.getAllIndexDefinition",
    code: codeModules["./get_all_index_definition.sql"],
  },
  {
    key: "query_running_queries",
    labelKey: "i18nCommon.postgreSQLTemplate.queryRunningQueries",
    code: codeModules["./query_running_queries.sql"],
  },
  {
    key: "kill_all_session",
    labelKey: "i18nCommon.postgreSQLTemplate.killAllSession",
    code: codeModules["./kill_all_session.sql"],
  },
  {
    key: "query_kill_process",
    labelKey: "i18nCommon.postgreSQLTemplate.queryKillProcess",
    code: codeModules["./query_kill_process.sql"],
  },
  {
    key: "query_delete_history_by_trigger",
    labelKey: "i18nCommon.postgreSQLTemplate.queryDeleteHistoryByTrigger",
    code: codeModules["./query_delete_history_by_trigger.sql"],
  },
];
