const codeModules = import.meta.glob("./*.cs", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, code]) => {
  const key = path.split("/").pop().replace(".cs", "");
  let labelKey = `i18nTemplate.CSharpTemplate.${key}`;
  return { key, labelKey, code };
});

export default templates;
