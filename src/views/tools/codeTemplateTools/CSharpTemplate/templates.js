// cấu hình import code từ file raw
const codeModules = import.meta.glob("./template/*.cs", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "TwoThreadUsingList",
    labelKey: "i18nCommon.CSharpTemplate.TwoThreadUsingList",
    code: codeModules["./template/TwoThreadUsingList.cs"],
  },
  {
    key: "TwoThreadUsingConcurrentQueue",
    labelKey: "i18nCommon.CSharpTemplate.TwoThreadUsingConcurrentQueue",
    code: codeModules["./template/TwoThreadUsingConcurrentQueue.cs"],
  },
  {
    key: "MaxThreadUsingTaskWhenAny",
    labelKey: "i18nCommon.CSharpTemplate.MaxThreadUsingTaskWhenAny",
    code: codeModules["./template/MaxThreadUsingTaskWhenAny.cs"],
  },
  {
    key: "MaxThreadUsingSemaphoreSlim",
    labelKey: "i18nCommon.CSharpTemplate.MaxThreadUsingSemaphoreSlim",
    code: codeModules["./template/MaxThreadUsingSemaphoreSlim.cs"],
  },
];
