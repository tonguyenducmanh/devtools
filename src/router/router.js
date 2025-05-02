import { createRouter, createWebHistory } from "vue-router";
// cấu hình router dùng chung cho nhiều file
const routerConfig = [
  {
    /**
     * trang chủ
     */
    path: "/:pathMatch(.*)*",
    pathVisible:"/",
    name: "home",
    component: () => import("@/views/TDWelcome.vue"),
    title: "Welcome",
  },
  {
    /**
     * chuyển đổi ảnh thành base 64
     */
    path: "/imagetobase64",
    name: "imagetobase64",
    component: () => import("@/views/tools/TDImageToBase64.vue"),
    title: "Image to base64",
  },
  {
    /**
     * chuyển đổi ảnh thành base 64
     */
    path: "/base64toimage",
    name: "base64toimage",
    component: () => import("@/views/tools/TDBase64ToImage.vue"),
    title: "Base64 to image",
  },
  {
    /**
     * chuyển đổi json thành câu lệnh insert postgresql
     */
    path: "/jsontopostgresql",
    name: "jsontopostgresql",
    component: () => import("@/views/tools/TDJSONToPostgreSQL.vue"),
    title: "Json to postgre sql",
  },
  {
    /**
     * chuyển đổi văn bản thành mã QR
     */
    path: "/textoqrcode",
    name: "textoqrcode",
    component: () => import("@/views/tools/TDTextToQRCode.vue"),
    title: "Text to QRCode",
  },
  {
    /**
     * chuyển đổi văn bản thành mã QR
     */
    path: "/mappingjson",
    name: "mappingjson",
    component: () => import("@/views/tools/TDMappingJSON.vue"),
    title: "Mapping JSON",
  },
  {
    /**
     * download vscode extension
     */
    path: "/downloadvscodeext",
    name: "downloadvscodeext",
    component: () => import("@/views/tools/TDDownloadVSCodeExt.vue"),
    title: "Download VSCode Extension",
  },
  {
    /**
     * uuid v4 generator
     */
    path: "/uuidv4generator",
    name: "uuidv4generator",
    component: () => import("@/views/tools/TDUUIDv4Generator.vue"),
    title: "UUIDv4 generator",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routerConfig,
});

export default router;

export { routerConfig };
