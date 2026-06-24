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
  {
    key: "Singleton",
    labelKey: "i18nCommon.CSharpTemplate.Singleton",
    code: codeModules["./template/Singleton.cs"],
  },
  {
    key: "FactoryMethod",
    labelKey: "i18nCommon.CSharpTemplate.FactoryMethod",
    code: codeModules["./template/FactoryMethod.cs"],
  },
  {
    key: "Strategy",
    labelKey: "i18nCommon.CSharpTemplate.Strategy",
    code: codeModules["./template/Strategy.cs"],
  },
  {
    key: "Observer",
    labelKey: "i18nCommon.CSharpTemplate.Observer",
    code: codeModules["./template/Observer.cs"],
  },
  {
    key: "Builder",
    labelKey: "i18nCommon.CSharpTemplate.Builder",
    code: codeModules["./template/Builder.cs"],
  },
  {
    key: "Adapter",
    labelKey: "i18nCommon.CSharpTemplate.Adapter",
    code: codeModules["./template/Adapter.cs"],
  },
  {
    key: "Decorator",
    labelKey: "i18nCommon.CSharpTemplate.Decorator",
    code: codeModules["./template/Decorator.cs"],
  },
  {
    key: "Facade",
    labelKey: "i18nCommon.CSharpTemplate.Facade",
    code: codeModules["./template/Facade.cs"],
  },
  {
    key: "Prototype",
    labelKey: "i18nCommon.CSharpTemplate.Prototype",
    code: codeModules["./template/Prototype.cs"],
  },
  {
    key: "VolatilePattern",
    labelKey: "i18nCommon.CSharpTemplate.VolatilePattern",
    code: codeModules["./template/VolatilePattern.cs"],
  },
  {
    key: "LazyInitialization",
    labelKey: "i18nCommon.CSharpTemplate.LazyInitialization",
    code: codeModules["./template/LazyInitialization.cs"],
  },
  {
    key: "DoubleCheckLocking",
    labelKey: "i18nCommon.CSharpTemplate.DoubleCheckLocking",
    code: codeModules["./template/DoubleCheckLocking.cs"],
  },
];
