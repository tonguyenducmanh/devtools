// cấu hình import shell script từ file raw
const codeModules = import.meta.glob("./*.sh", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".sh", "");
  let labelKey = `i18nTemplate.gitTemplate.${key}`;

  return { key, labelKey, code };
});

export default templates;
