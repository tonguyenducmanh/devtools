<!-- components/ToastContainer.vue -->
<template>
  <teleport to="body">
    <div class="flex flex-col td-toast-container">
      <transition-group name="td-toast" tag="div" class="flex flex-col td-toast-wrapper">
        <div v-for="toast in toasts" :key="toast.id" :class="['toast', `td-toast-${toast.type}`]"
          @click="removeToast(toast.id)">
          <div class="td-toast-content">
            <div v-if="toast.message" class="td-toast-message">
              {{ toast.message }}
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script>
export default {
  name: "TDToastMessage",
  data() {
    return {
      toasts: [],
      toastIdCounter: 0,
    };
  },
  methods: {
    addToast(toast) {
      let me = this;
      const id = ++this.toastIdCounter;
      const newToast = {
        id,
        type: toast.type || "info",
        message: toast.message || "",
        duration: toast.duration || 1500,
      };

      this.toasts.unshift(newToast);

      // Tự động xóa toast sau thời gian đã định
      setTimeout(() => {
        this.removeToast(id);
      }, newToast.duration);

      return id;
    },

    removeToast(id) {
      const index = this.toasts.findIndex((toast) => toast.id === id);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    },

    // Các phương thức tiện ích
    showSuccess(title, message) {
      return this.addToast({ type: "success", title, message });
    },

    showError(title, message) {
      return this.addToast({ type: "error", title, message });
    },

    showWarning(title, message) {
      return this.addToast({ type: "warning", title, message });
    },

    showInfo(title, message) {
      return this.addToast({ type: "info", title, message });
    },

    clearAll() {
      this.toasts = [];
    },
  },
};
</script>

<style scoped>
.td-toast-container {
  position: fixed;
  top: var(--padding);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  gap: var(--padding);
  max-width: 500px;
  pointer-events: none;
}

.toast {
  cursor: pointer;
  background-color: var(--bg-main-color);
  border-radius: var(--border-radius-component);
  box-shadow: var(--box-shadow);
  border: 1px solid var(--focus-color);
  padding: var(--padding);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  margin-top: var(--padding);
  box-sizing: border-box;
  width: fit-content;
}

.td-toast-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.td-toast-success {
  /* border-color: #10b981;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15); */
}

.td-toast-error {
  /* border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15); */
}

.td-toast-warning {
  /* border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15); */
}

.td-toast-info {
  /* border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15); */
}

.td-toast-message {
  flex: 1;
  min-width: 0;
  text-align: center;
}

/* Animation transitions */
.td-toast-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.td-toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.td-toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.td-toast-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.td-toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
