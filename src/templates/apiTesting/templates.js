const codeModules = import.meta.glob("./*.js", {
  query: "?raw",
  import: "default",
  eager: true,
});

const templates = Object.entries(codeModules).map(([path, content]) => {
  const tooltipKey = path.split("/").pop().replace(".js", "");
  return { tooltipKey, content };
});

export default templates;
