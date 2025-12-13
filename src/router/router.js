import { createRouter, createWebHistory } from "vue-router";
import i18nData from "@/i18n/i18nData.js";

// cấu hình router dùng chung cho nhiều file
const routerConfig = [
  {
    /**
     * trang chủ
     */
    path: "/:pathMatch(.*)*",
    pathVisible: "/",
    name: "home",
    component: () => import("@/views/TDWelcome.vue"),
    meta: {
      titleKey: "i18nCommon.feature.welcome",
    },
  },
  {
    /**
     * Time-based one-time password authenticator
     */
    path: "/TDOneTimePassword",
    name: "TDOneTimePassword",
    component: () => import("@/views/tools/TDOneTimePassword.vue"),
    meta: {
      titleKey: "i18nCommon.feature.oneTimePassword",
    },
  },
  {
    /**
     * Time-based one-time password authenticator
     */
    path: "/TDHTMLPreview",
    name: "TDHTMLPreview",
    component: () => import("@/views/tools/TDHTMLPreview.vue"),
    meta: {
      titleKey: "i18nCommon.feature.HTMLPreview",
    },
  },
  {
    /**
     * chuyển đổi văn bản thành mã QR
     */
    path: "/textoqrcode",
    name: "textoqrcode",
    component: () => import("@/views/tools/TDTextToQRCode.vue"),
    meta: {
      titleKey: "i18nCommon.feature.QRCodeFromText",
    },
  },
  {
    /**
     * chuyển đổi mã QR thành văn bản
     */
    path: "/qrcodetotext",
    name: "qrcodetotext",
    component: () => import("@/views/tools/TDQRCodeToText.vue"),
    meta: {
      titleKey: "i18nCommon.feature.QRCodeToText",
    },
  },
  {
    /**
     * Nén text bằng 1 số thuật toán phổ biến
     */
    path: "/TDTextCompress",
    name: "TDTextCompress",
    component: () => import("@/views/tools/TDTextCompress.vue"),
    meta: {
      titleKey: "i18nCommon.feature.textCompress",
    },
  },
  {
    /**
     * Xử lý văn bản/thao túng văn bản
     */
    path: "/TDTextManipulation",
    name: "TDTextManipulation",
    component: () => import("@/views/tools/TDTextManipulation.vue"),
    meta: {
      titleKey: "i18nCommon.feature.textManipulation",
    },
  },
  {
    /**
     * so sánh code giữa 2 file
     */
    path: "/comparecode",
    name: "comparecode",
    component: () => import("@/views/tools/TDCompareCode.vue"),
    meta: {
      titleKey: "i18nCommon.feature.compareCode",
    },
  },
  {
    /**
     * chọn màu từ ảnh
     */
    path: "/colorpicker",
    name: "colorpicker",
    component: () => import("@/views/tools/TDColorPicker.vue"),
    meta: {
      titleKey: "i18nCommon.feature.colorPicker",
    },
  },
  {
    /**
     * PostgreSQL Formatter
     */
    path: "/codeformatter",
    name: "codeformatter",
    component: () => import("@/views/tools/TDCodeFormatter.vue"),
    meta: {
      titleKey: "i18nCommon.feature.CodeFormatter",
    },
  },
  {
    /**
     * Tính độ tương đồng cosine giữa 2 vector
     */
    path: "/cosinsimilarity",
    name: "cosinsimilarity",
    component: () => import("@/views/tools/TDCosinSimilarity.vue"),
    meta: {
      titleKey: "i18nCommon.feature.cosinSimilarity",
    },
  },
  {
    /**
     * chuyển đổi json thành câu lệnh insert postgresql
     */
    path: "/jsontopostgresql",
    name: "jsontopostgresql",
    component: () => import("@/views/tools/TDJSONToPostgreSQL.vue"),
    meta: {
      titleKey: "i18nCommon.feature.JSONToPostgreSQL",
    },
  },
  {
    /**
     * mapping đệ quy json value
     */
    path: "/mappingjson",
    name: "mappingjson",
    component: () => import("@/views/tools/TDMappingJSON.vue"),
    meta: {
      titleKey: "i18nCommon.feature.JSONMapping",
    },
  },
  {
    /**
     * convert JSON sang Excel
     */
    path: "/jsontoexcel",
    name: "jsontoexcel",
    component: () => import("@/views/tools/TDJSONToExcel.vue"),
    meta: {
      titleKey: "i18nCommon.feature.JSONToExcel",
    },
  },
  {
    /**
     * chuyển đổi base 64 thành ảnh
     */
    path: "/base64toimage",
    name: "base64toimage",
    component: () => import("@/views/tools/TDBase64ToImage.vue"),
    meta: {
      titleKey: "i18nCommon.feature.ImageFromBase64",
    },
  },
  {
    /**
     * chuyển đổi ảnh thành base 64
     */
    path: "/imagetobase64",
    name: "imagetobase64",
    component: () => import("@/views/tools/TDImageToBase64.vue"),
    meta: {
      titleKey: "i18nCommon.feature.ImageToBase64",
    },
  },
  {
    /**
     * download vscode extension
     */
    path: "/downloadvscodeext",
    name: "downloadvscodeext",
    component: () => import("@/views/tools/TDDownloadVSCodeExt.vue"),
    meta: {
      titleKey: "i18nCommon.feature.DownloadVSCodeExtension",
    },
  },
  {
    /**
     * uuid v4 generator
     */
    path: "/uuidv4generator",
    name: "uuidv4generator",
    component: () => import("@/views/tools/TDUUIDv4Generator.vue"),
    meta: {
      titleKey: "i18nCommon.feature.UUIDV4Generator",
    },
  },
  {
    /**
     * API Testing Tool
     */
    path: "/apitesting",
    name: "apitesting",
    component: () => import("@/views/tools/TDAPITesting.vue"),
    meta: {
      titleKey: "i18nCommon.feature.APITesting",
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routerConfig,
});

router.beforeEach((to, from, next) => {
  let appName = window.__env.appName;
  if (
    to &&
    to.meta &&
    to.meta.titleKey &&
    i18nData.global.te(to.meta.titleKey)
  ) {
    document.title = i18nData.global.t(to.meta.titleKey);
  } else if (appName) {
    document.title = `${window.__env.author} | ${appName}`;
  }
  next();
});

export default router;

export { routerConfig };
