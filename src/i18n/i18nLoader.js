import i18nData from "@/i18n/i18nData.js";
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
