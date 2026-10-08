import { createApp } from "vue";
import "@/cfg/config.js";
import App from "@/App.vue";
import cache from "@/common/cache/TMCache.js";
import tmEnum from "@/common/TMEnum.js";
import tmUtility from "@/common/TMUtility.js";
import TMButton from "@/components/TMButton.vue";
import TMTextEditor from "@/components/TMTextEditor.vue";
import TMLoading from "@/components/TMLoading.vue";
import TMInput from "@/components/TMInput.vue";
import TMCheckbox from "@/components/TMCheckbox.vue";
import TMColorPicker from "@/components/TMColorPicker.vue";
import TMUpload from "@/components/TMUpload.vue";
import TMRadio from "@/components/TMRadio.vue";
import TMRadioGroup from "@/components/TMRadioGroup.vue";
import TMSlideOption from "@/components/TMSlideOption.vue";
import TMComboBox from "@/components/TMComboBox.vue";
import TMHistory from "@/components/TMHistory.vue";
import TMTableViewer from "@/components/TMTableViewer.vue";
import TMResizer from "@/components/TMResizer.vue";
import TMVirtualScroll from "@/components/TMVirtualScroll.vue";
import TMDateTime from "@/components/TMDateTime.vue";
import TMPopup from "@/components/TMPopup.vue";
import i18nData, { loadLocaleDefault } from "@/i18n/i18nData.js";
import tmEventbus from "@/common/event/TMEventBus.js";
import TMToastPlugin from "@/common/plugin/TMToastPlugin.js";
import TMContextMenuPlugin from "@/common/plugin/TMContextMenuPlugin.js";
import TMClickOutside from "@/directives/TMClickOutside.js";
import TMTooltip from "@/directives/TMTooltip.js";
import "@/common/plugin/TMMonacoEditor.js";

// Async IIFE
(async () => {
  const currentApp = createApp(App);

  // add 1 vài directive
  currentApp.directive("click-outside", TMClickOutside);
  currentApp.directive("tooltip", TMTooltip);

  // add 1 vài global object
  currentApp.config.globalProperties.$tmCache = cache;
  currentApp.config.globalProperties.$tmEnum = tmEnum;
  currentApp.config.globalProperties.$tmUtility = tmUtility;
  currentApp.config.globalProperties.$tmEventBus = tmEventbus;

  // add 1 vài component global
  currentApp.component("TMButton", TMButton);
  currentApp.component("TMTextEditor", TMTextEditor);
  currentApp.component("TMLoading", TMLoading);
  currentApp.component("TMInput", TMInput);
  currentApp.component("TMCheckbox", TMCheckbox);
  currentApp.component("TMUpload", TMUpload);
  currentApp.component("TMRadio", TMRadio);
  currentApp.component("TMRadioGroup", TMRadioGroup);
  currentApp.component("TMSlideOption", TMSlideOption);
  currentApp.component("TMComboBox", TMComboBox);
  currentApp.component("TMHistory", TMHistory);
  currentApp.component("TMPopup", TMPopup);
  currentApp.component("TMTableViewer", TMTableViewer);
  currentApp.component("TMResizer", TMResizer);
  currentApp.component("TMVirtualScroll", TMVirtualScroll);
  currentApp.component("TMDateTime", TMDateTime);
  currentApp.component("TMColorPicker", TMColorPicker);

  // globalization language
  currentApp.use(i18nData);

  // using toastmessage
  currentApp.use(TMToastPlugin);

  // context menu
  currentApp.use(TMContextMenuPlugin);

  // load ngôn ngữ
  await loadLocaleDefault();

  currentApp.mount("#app");
})();
