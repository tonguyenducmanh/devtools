// cấu hình import sql từ file raw
const codeModules = import.meta.glob("./*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".sql", "");
  let labelKey = `i18nTemplate.postgreSQLTemplate.${key}`;

  return { key, labelKey, code };
});

export default templates;
