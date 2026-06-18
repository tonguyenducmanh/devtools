// cấu hình import code từ file raw
const codeModules = import.meta.glob("./template/*.ps1", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "PullCodeFromRepo",
    labelKey: "i18nCommon.PowerShellTemplate.PullCodeFromRepo",
    code: codeModules["./template/PullCodeFromRepo.ps1"],
  },
];
