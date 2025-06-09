import { createI18n } from "vue-i18n";
import en from "@/i18n/en/i18nCommon.js";
import vi from "@/i18n/vi/i18nCommon.js";

const messages = {
  en,
  vi,
};

const i18nData = createI18n({
  legacy: false, // for Composition API (you can still use Options API)
  locale: "en",
  fallbackLocale: "en",
  messages,
});

export default i18nData;
