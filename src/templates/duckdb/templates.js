// Cấu hình import sql từ file raw cho DuckDB templates
const codeModules = import.meta.glob("./*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".sql", "");
  let labelKey = `i18nTemplate.DuckDBTemplate.${key}`;

  return { key, labelKey, code };
});

export default templates;
