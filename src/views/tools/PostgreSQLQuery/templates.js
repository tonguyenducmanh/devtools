// cấu hình import sql từ file raw
const codeModules = import.meta.glob("./template/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default {
  pg_get_keywords: codeModules["./template/pg_get_keywords.sql"],
  pg_get_tables: codeModules["./template/pg_get_tables.sql"],
  pg_test_connection: codeModules["./template/pg_test_connection.sql"],
};
