import { createI18n } from "vue-i18n";

const messages = {};

const i18nData = createI18n({
  legacy: false, // for Composition API (you can still use Options API)
  locale: "en",
  fallbackLocale: "vi",
  messages,
});

export default i18nData;
