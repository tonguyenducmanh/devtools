import { createRouter, createWebHistory } from "vue-router";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      /**
       * trang chủ
       */
      path: "/:pathMatch(.*)*",
      name: "home",
      component: () => import("@/views/TDWelcome.vue"),
    },
    {
      /**
       * chuyển đổi ảnh thành base 64
       */
      path: "/imagetobase64",
      name: "imagetobase64",
      component: () => import("@/views/tools/TDImageToBase64.vue"),
    },
    {
      /**
       * chuyển đổi ảnh thành base 64
       */
      path: "/base64toimage",
      name: "base64toimage",
      component: () => import("@/views/tools/TDBase64ToImage.vue"),
    },
    {
      /**
       * chuyển đổi json thành câu lệnh insert postgresql
       */
      path: "/jsontopostgresql",
      name: "jsontopostgresql",
      component: () => import("@/views/tools/TDJSONToPostgreSQL.vue"),
    },
    {
      /**
       * chuyển đổi văn bản thành mã QR
       */
      path: "/textoqrcode",
      name: "textoqrcode",
      component: () => import("@/views/tools/TDTextToQRCode.vue"),
    },
  ],
});

export default router;
