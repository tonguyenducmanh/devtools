import { createApp } from "vue";
import App from "@/App.vue";
import cache from "@/common/TDCache.js";
import enumeration from "@/common/TDEnum.js";
import utility from "@/common/TDUtility.js";
import router from "@/router/router.js";
import TDButton from "@/components/TDButton.vue";
import TDTextarea from "@/components/TDTextarea.vue";
import TDInput from "@/components/TDInput.vue";
import TDCheckbox from "@/components/TDCheckbox.vue";

const currentApp = createApp(App);

// add 1 vài global object
currentApp.config.globalProperties.$tdCache = cache;
currentApp.config.globalProperties.$tdEnum = enumeration;
currentApp.config.globalProperties.$tdUtility = utility;

// add 1 vài component global
currentApp.component("TDButton", TDButton);
currentApp.component("TDTextarea", TDTextarea);
currentApp.component("TDInput", TDInput);
currentApp.component("TDCheckbox", TDCheckbox);

currentApp.use(router);

currentApp.mount("#app");
