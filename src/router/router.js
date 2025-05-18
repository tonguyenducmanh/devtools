import { createRouter, createWebHistory } from "vue-router";
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
      title: "Welcome",
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
      title: "Compare code",
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
      title: "One time password",
    },
  },
  {
    /**
     * convert từ JSON sang object và object sang JSON
     */
    path: "/jsonparser",
    name: "jsonparser",
    component: () => import("@/views/tools/TDJSONParser.vue"),
    meta: {
      title: "JSON parser",
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
      title: "Base64 to image",
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
      title: "Image to base64",
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
      title: "JSON to postgre sql",
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
      title: "Text to QRCode",
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
      title: "QRCode to text",
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
      title: "Mapping JSON",
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
      title: "Download VSCode Extension",
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
      title: "UUIDv4 generator",
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routerConfig,
});

router.beforeEach((to, from, next) => {
  if (to && to.meta && to.meta.title) {
    document.title = `Utility |  ${to.meta.title}`;
  } else {
    document.title = "Utility for dev";
  }
  next();
});

export default router;

export { routerConfig };
