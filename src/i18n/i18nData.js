import { reactive, computed } from "vue";
import i18nGlobal from "@/i18n/global/i18nGlobal.js";

/**
 * Tự quản lý logic đa ngôn ngữ thay vì xài thư viện bên ngoài
 */

let state = reactive({
  locale: "en",
  fallbackLocale: "vi",
  messages: {},
});

/**
 * Lấy value dựa vào đường dẫn của key
 * @param {*} obj object chứa data i18n cần lấy dữ liệu
 * @param {*} path đường dẫn tới object đó
 * @returns
 */

let getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((prev, curr) => prev && prev[curr], obj);
};

/**
 * lấy value i18n trong data
 * @param {*} key giá trị i18n
 * @returns
 */
let t = (key) => {
  let message = state.messages[state.locale];
  let fallback = state.messages[state.fallbackLocale];
  return getNestedValue(message, key) || getNestedValue(fallback, key) || key;
};

/**
 * kỉem tra key có tồn tại trong data i18n không
 * @param {*} key giá trị i18n
 * @returns
 */

let te = (key, locale = state.locale) => {
  return getNestedValue(state.messages[locale], key) !== undefined;
};

/**
 * Tạo object giả lập cấu trúc của vue-i18n
 */
let i18nData = {
  global: {
    t,
    te,
    // Dùng computed để khi state.locale thay đổi, locale.value cũng đổi theo
    locale: computed({
      get: () => state.locale,
      set: (val) => {
        state.locale = val;
      },
    }),
    availableLocales: computed(() => Object.keys(state.messages)),
  },
  /**
   * xử lý inject $t và $te vào global vue app
   * @param {*} app
   */
  install(app) {
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$te = te;
    app.provide("i18n", i18nData);
  },
};

/**
 * Load dữ liệu i18n cho 1 ngôn ngữ mới
 * @param {*} locale
 */

export async function loadLocale(locale) {
  // nếu chưa có messages cho locale này thì load
  if (!state.messages[locale]) {
    // import động các tệp tin ngôn ngữ tương ứng
    let msgs = await import(`@/i18n/${locale}/i18nCommon.js`);
    let helps = await import(`@/i18n/${locale}/i18nHelp.js`);
    state.messages[locale] = {
      ...i18nGlobal,
      ...msgs.default,
      ...helps.default,
    };
  }
  // Gán giá trị thông qua .value vì đây là computed setter
  i18nData.global.locale.value = locale;
}

export default i18nData;
