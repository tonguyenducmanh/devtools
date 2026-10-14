import { reactive } from "vue";

export const appState = reactive({
  zenMode: false,
  // "header" → menu công cụ nằm trên thanh header (App.vue không render sidebar)
  // "sidebar" → cột dọc bên trái        "right" → cột dọc bên phải
  sideBarMenuPosition: "sidebar",
});
