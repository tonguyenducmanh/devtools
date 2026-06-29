// cấu hình import code từ file raw
const codeModules = import.meta.glob("./*.ps1", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".ps1", "");
  let labelKey = `i18nTemplate.PowerShellTemplate.${key}`;
  return { key, labelKey, code };
});

export default templates;
