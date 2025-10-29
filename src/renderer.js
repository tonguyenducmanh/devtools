import { createApp } from "vue";
import App from "@/App.vue";
import cache from "@/common/cache/TDCache.js";
import enumeration from "@/common/TDEnum.js";
import utility from "@/common/TDUtility.js";
import router from "@/router/router.js";
import TDButton from "@/components/TDButton.vue";
import TDTextarea from "@/components/TDTextarea.vue";
import TDInput from "@/components/TDInput.vue";
import TDCheckbox from "@/components/TDCheckbox.vue";
import TDUpload from "@/components/TDUpload.vue";
import TDRadio from "@/components/TDRadio.vue";
import TDRadioGroup from "@/components/TDRadioGroup.vue";
import TDHistory from "@/components/TDHistory.vue";
import i18nData, { loadLocale } from "@/i18n/i18nData.js";
import eventBus from "@/common/event/TDEventBus.js";
import ToastPlugin from "@/common/TDToastUtil.js";
// import blazor webassembly
import { dotnet } from "/public/_framework/dotnet.js";

// Async IIFE
(async () => {
  const currentApp = createApp(App);

  // add 1 vài global object
  currentApp.config.globalProperties.$tdCache = cache;
  currentApp.config.globalProperties.$tdEnum = enumeration;
  currentApp.config.globalProperties.$tdUtility = utility;
  currentApp.config.globalProperties.$tdEventBus = eventBus;

  // add 1 vài component global
  currentApp.component("TDButton", TDButton);
  currentApp.component("TDTextarea", TDTextarea);
  currentApp.component("TDInput", TDInput);
  currentApp.component("TDCheckbox", TDCheckbox);
  currentApp.component("TDUpload", TDUpload);
  currentApp.component("TDRadio", TDRadio);
  currentApp.component("TDRadioGroup", TDRadioGroup);
  currentApp.component("TDHistory", TDHistory);

  // router link
  currentApp.use(router);

  // globalization language
  currentApp.use(i18nData);

  // using toastmessage
  currentApp.use(ToastPlugin);

  // Lấy ngôn ngữ hiện tại
  let currentLanguage = await cache.get(enumeration.cacheConfig.Language);
  let locale = currentLanguage ? currentLanguage : enumeration.language.vi;
  await loadLocale(locale);

  currentApp.mount("#app");
  const runtime = await dotnet.create();
  runtime.setModuleImports("globalThis", globalThis);

  // demo gọi hàm từ blazor wasm
  // const { getAssemblyExports } = runtime;
  // const exports = await getAssemblyExports("Tools.NetWrapper.dll");
  // const { ToolsTensor } = exports.Tools.NetWrapper;
  // // 1. Chuẩn bị đối tượng JavaScript
  // const inputData = {
  //   // Mảng float (Number trong JS)
  //   FirstVector: [1.0, 2.0, 3.0, 4.0],
  //   SecondVector: [5.0, 6.0, 7.0, 8.0],
  // };

  // // 2. Marshalling: Chuyển đối tượng JS thành chuỗi JSON
  // const jsonString = JSON.stringify(inputData);

  // try {
  //   // 3. Gọi hàm C# đã export
  //   const resultString = ToolsTensor.CosinSimilarity(jsonString);

  //   // 4. Xử lý kết quả (Vì C# trả về float.ToString() là một chuỗi)
  //   const similarity = parseFloat(resultString);

  //   console.log("Input Data:", inputData);
  //   console.log("JSON Sent to C#:", jsonString);
  //   console.log("Result (string from C#):", resultString);
  //   console.log("Cosin Similarity:", similarity); // Kết quả là một số (float)
  // } catch (error) {
  //   console.error("Lỗi khi gọi CosinSimilarity từ C#:", error);
  // }
  // debugger;

  // gán runtime vào window để các module khác có thể dùng
  window.__dotnet_runtime = runtime;
})();
