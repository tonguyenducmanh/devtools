// cấu hình import code từ file raw
const codeModules = import.meta.glob("./*.js", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "JSONFileHandle",
    labelKey: "i18nCommon.JavaScriptTemplate.JSONFileHandle",
    code: codeModules["./JSONFileHandle.js"],
  },
];
