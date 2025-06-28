// utils/toast.js
import { createApp } from "vue";
import ToastContainer from "@/components/TDToastMessage.vue";

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
      title: options.title || "Thông báo",
      message: options.message || "",
      duration: options.duration || 5000,
    };

    return this.toastInstance.addToast(config);
  }

  // Các phương thức tiện ích
  success(title, message, duration) {
    return this.show({
      type: "success",
      title,
      message,
      duration,
    });
  }

  error(title, message, duration) {
    return this.show({
      type: "error",
      title,
      message,
      duration,
    });
  }

  warning(title, message, duration) {
    return this.show({
      type: "warning",
      title,
      message,
      duration,
    });
  }

  info(title, message, duration) {
    return this.show({
      type: "info",
      title,
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

// =================================================================
// common/toast.js - File riêng để đăng ký plugin
// =================================================================
export default ToastPlugin;

// =================================================================
// main.js - Cách đăng ký trong main.js
// =================================================================

/*
import { createApp } from 'vue'
import App from './App.vue'
import ToastPlugin from "@/common/TDToastUtil.js";


const app = createApp(App)

// Đăng ký toast plugin
app.use(ToastPlugin)

app.mount('#app')
*/

// =================================================================
// Cách sử dụng trong component
// =================================================================

/*
// Cách 1: Sử dụng qua global property
export default {
  methods: {
    handleSuccess() {
      this.$tdToast.success('Thành công!', 'Dữ liệu đã được lưu thành công')
    },
    
    handleError() {
      this.$tdToast.error('Lỗi!', 'Không thể kết nối đến server')
    },
    
    handleCustom() {
      this.$tdToast.show({
        type: 'warning',
        title: 'Cảnh báo tùy chỉnh',
        message: 'Thông báo với thời gian tùy chỉnh',
        duration: 3000
      })
    }
  }
}

// Cách 2: Import trực tiếp (không cần plugin)
import ToastPlugin from "@/common/TDToastUtil.js";


export default {
  methods: {
    handleClick() {
      ToastPlugin.success('Hello', 'World!')
    }
  }
}

*/
