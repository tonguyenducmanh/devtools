// utils/toast.js
import { createApp } from "vue";
import ToastContainer from "@/components/TDToastMessage.vue";
import i18nData from "@/i18n/i18nData.js";

class ToastManager {
  constructor() {
    this.toastInstance = null;
    this.container = null;
    this.init();
  }

  init() {
    // Tạo container cho toast
    this.container = document.createElement("div");
    this.container.id = "toast-container-global";
    document.body.appendChild(this.container);

    // Tạo Vue app instance cho toast
    const toastApp = createApp(ToastContainer);
    this.toastInstance = toastApp.mount(this.container);
  }

  // Phương thức chính để thêm toast
  show(options) {
    if (!this.toastInstance) {
      console.error("Toast instance not initialized");
      return;
    }

    const config = {
      type: options.type || "info",
      message: options.message || "",
      duration: options.duration || 1500,
    };

    return this.toastInstance.addToast(config);
  }

  // Các phương thức tiện ích
  success(message, duration) {
    return this.show({
      type: "success",
      message,
      duration,
    });
  }

  error(message, duration) {
    return this.show({
      type: "error",
      message,
      duration,
    });
  }

  warning(message, duration) {
    return this.show({
      type: "warning",
      message,
      duration,
    });
  }

  info(message, duration) {
    return this.show({
      type: "info",
      message,
      duration,
    });
  }

  // Xóa toast theo ID
  remove(id) {
    if (this.toastInstance) {
      this.toastInstance.removeToast(id);
    }
  }

  // Xóa tất cả toast
  clear() {
    if (this.toastInstance) {
      this.toastInstance.clearAll();
    }
  }

  // Destroy toast manager
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.toastInstance = null;
    this.container = null;
  }
}

// Tạo instance singleton
const toastManager = new ToastManager();

// Export các function để sử dụng
export const toast = {
  show: (options) => toastManager.show(options),
  success: (title, message, duration) =>
    toastManager.success(title, message, duration),
  error: (title, message, duration) =>
    toastManager.error(title, message, duration),
  warning: (title, message, duration) =>
    toastManager.warning(title, message, duration),
  info: (title, message, duration) =>
    toastManager.info(title, message, duration),
  remove: (id) => toastManager.remove(id),
  clear: () => toastManager.clear(),
};

// Plugin cho Vue 3
export const ToastPlugin = {
  install(app) {
    // Thêm vào global properties
    app.config.globalProperties.$tdToast = toast;

    // Thêm vào provide/inject
    app.provide("tdToast", toast);
  },
};

export default ToastPlugin;
