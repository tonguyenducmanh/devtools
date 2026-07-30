import { createApp } from "vue";
import App from "@/App.vue";
import cache from "@/common/cache/TDCache.js";
import tdEnum from "@/common/TDEnum.js";
import tdUtility from "@/common/TDUtility.js";
import TDButton from "@/components/TDButton.vue";
import TDTextEditor from "@/components/TDTextEditor.vue";
import TDLoading from "@/components/TDLoading.vue";
import TDInput from "@/components/TDInput.vue";
import TDCheckbox from "@/components/TDCheckbox.vue";
import TDColorPicker from "@/components/TDColorPicker.vue";
import TDUpload from "@/components/TDUpload.vue";
import TDRadio from "@/components/TDRadio.vue";
import TDRadioGroup from "@/components/TDRadioGroup.vue";
import TDSlideOption from "@/components/TDSlideOption.vue";
import TDComboBox from "@/components/TDComboBox.vue";
import TDHistory from "@/components/TDHistory.vue";
import TDTableViewer from "@/components/TDTableViewer.vue";
import TDResizer from "@/components/TDResizer.vue";
import TDVirtualScroll from "@/components/TDVirtualScroll.vue";
import TDDateTime from "@/components/TDDateTime.vue";
import TDPopup from "@/components/TDPopup.vue";
import i18nData, { loadLocaleDefault } from "@/i18n/i18nData.js";
import tdEventbus from "@/common/event/TDEventBus.js";
import TDToastPlugin from "@/common/plugin/TDToastPlugin.js";
import TDContextMenuPlugin from "@/common/plugin/TDContextMenuPlugin.js";
import TDClickOutside from "@/directives/TDClickOutside.js";
import TDTooltip from "@/directives/TDTooltip.js";
import "@/common/plugin/TDMonacoEditor.js";

// Async IIFE
(async () => {
  const currentApp = createApp(App);

  // add 1 vài directive
  currentApp.directive("click-outside", TDClickOutside);
  currentApp.directive("tooltip", TDTooltip);

  // add 1 vài global object
  currentApp.config.globalProperties.$tdCache = cache;
  currentApp.config.globalProperties.$tdEnum = tdEnum;
  currentApp.config.globalProperties.$tdUtility = tdUtility;
  currentApp.config.globalProperties.$tdEventBus = tdEventbus;

  // add 1 vài component global
  currentApp.component("TDButton", TDButton);
  currentApp.component("TDTextEditor", TDTextEditor);
  currentApp.component("TDLoading", TDLoading);
  currentApp.component("TDInput", TDInput);
  currentApp.component("TDCheckbox", TDCheckbox);
  currentApp.component("TDUpload", TDUpload);
  currentApp.component("TDRadio", TDRadio);
  currentApp.component("TDRadioGroup", TDRadioGroup);
  currentApp.component("TDSlideOption", TDSlideOption);
  currentApp.component("TDComboBox", TDComboBox);
  currentApp.component("TDHistory", TDHistory);
  currentApp.component("TDPopup", TDPopup);
  currentApp.component("TDTableViewer", TDTableViewer);
  currentApp.component("TDResizer", TDResizer);
  currentApp.component("TDVirtualScroll", TDVirtualScroll);
  currentApp.component("TDDateTime", TDDateTime);
  currentApp.component("TDColorPicker", TDColorPicker);

  // globalization language
  currentApp.use(i18nData);

  // using toastmessage
  currentApp.use(TDToastPlugin);

  // context menu
  currentApp.use(TDContextMenuPlugin);

  // load ngôn ngữ
  await loadLocaleDefault();

  currentApp.mount("#app");
})();
