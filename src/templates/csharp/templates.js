// cấu hình import code từ file raw
const codeModules = import.meta.glob("./*.cs", {
  query: "?raw",
  import: "default",
  eager: true,
});

export default [
  {
    key: "TwoThreadUsingList",
    labelKey: "i18nCommon.CSharpTemplate.TwoThreadUsingList",
    code: codeModules["./TwoThreadUsingList.cs"],
  },
  {
    key: "TwoThreadUsingConcurrentQueue",
    labelKey: "i18nCommon.CSharpTemplate.TwoThreadUsingConcurrentQueue",
    code: codeModules["./TwoThreadUsingConcurrentQueue.cs"],
  },
  {
    key: "MaxThreadUsingTaskWhenAny",
    labelKey: "i18nCommon.CSharpTemplate.MaxThreadUsingTaskWhenAny",
    code: codeModules["./MaxThreadUsingTaskWhenAny.cs"],
  },
  {
    key: "MaxThreadUsingSemaphoreSlim",
    labelKey: "i18nCommon.CSharpTemplate.MaxThreadUsingSemaphoreSlim",
    code: codeModules["./MaxThreadUsingSemaphoreSlim.cs"],
  },
];
