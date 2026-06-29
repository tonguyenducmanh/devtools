const codeModules = import.meta.glob("./*.js", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, content]) => {
  const i18nField = path.split("/").pop().replace(".js", "");
  let tooltipKey = `i18nTemplate.apiTesting.${i18nField}`;
  return { tooltipKey, content };
});

export default templates;
