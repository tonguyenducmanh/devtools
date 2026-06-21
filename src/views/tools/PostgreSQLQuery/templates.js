// cấu hình import sql từ file raw
const codeModules = import.meta.glob("./template/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default {
  pg_get_keywords: codeModules["./template/pg_get_keywords.sql"],
  pg_get_tables_count: codeModules["./template/pg_get_tables_count.sql"],
  pg_get_tables_paging: codeModules["./template/pg_get_tables_paging.sql"],
  pg_test_connection: codeModules["./template/pg_test_connection.sql"],
  pg_get_functions_count: codeModules["./template/pg_get_functions_count.sql"],
  pg_get_functions_paging: codeModules["./template/pg_get_functions_paging.sql"],
  pg_inspect_search_table: codeModules["./template/pg_inspect_search_table.sql"],
  pg_inspect_search_view: codeModules["./template/pg_inspect_search_view.sql"],
  pg_inspect_search_function: codeModules["./template/pg_inspect_search_function.sql"],
  pg_inspect_ddl_table: codeModules["./template/pg_inspect_ddl_table.sql"],
  pg_inspect_ddl_view: codeModules["./template/pg_inspect_ddl_view.sql"],
  pg_inspect_ddl_function: codeModules["./template/pg_inspect_ddl_function.sql"],
};
