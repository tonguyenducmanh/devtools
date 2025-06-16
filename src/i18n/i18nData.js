import { createI18n } from "vue-i18n";
import i18nGlobal from "@/i18n/global/i18nGlobal.js";

const messages = {};

const i18nData = createI18n({
  legacy: false, // for Composition API (you can still use Options API)
  locale: "en",
  fallbackLocale: "vi",
  messages,
});

export async function loadLocale(locale) {
  // nếu chưa có messages cho locale này thì load
  if (!i18nData.global.availableLocales.includes(locale)) {
    // import động các tệp tin ngôn ngữ tương ứng
    const msgs = await import(
      /* webpackChunkName: "locale-[request]" */
      `@/i18n/${locale}/i18nCommon.js`
    );
    // cấu hình messages cho locale này
    // luôn phải có i18nGlobal trong messages
    let currentMessage = {
      ...i18nGlobal,
      ...msgs.default,
    };

    // gán messages cho i18nData
    i18nData.global.setLocaleMessage(locale, currentMessage);
  }
  i18nData.global.locale.value = locale;
}

export default i18nData;
