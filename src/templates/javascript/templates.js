// cấu hình import code từ file raw
const codeModules = import.meta.glob("./*.js", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".js", "");
  let labelKey = `i18nTemplate.JavaScriptTemplate.${key}`;
  return { key, labelKey, code };
});

export default templates;
