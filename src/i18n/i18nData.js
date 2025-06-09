import { createI18n } from "vue-i18n";

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
    const msgs = await import(
      /* webpackChunkName: "locale-[request]" */
      `@/i18n/${locale}/i18nCommon.js`
    );
    i18nData.global.setLocaleMessage(locale, msgs.default);
  }
  i18nData.global.locale.value = locale;
}

export default i18nData;
