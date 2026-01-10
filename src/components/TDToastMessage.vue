<!-- components/ToastContainer.vue -->
<template>
  <teleport to="body">
    <div class="td-toast-container">
      <transition-group name="td-toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `td-toast-${toast.type}`]"
        >
          <div class="td-toast-content">
            <div class="td-toast-icon">
              <svg
                v-if="toast.type === 'success'"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="toast.type === 'error'"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="toast.type === 'warning'"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg v-else viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="td-toast-message">
              <div class="td-toast-title">{{ toast.title }}</div>
              <div v-if="toast.message" class="td-toast-text">
                {{ toast.message }}
              </div>
            </div>
          </div>
          <button @click="removeToast(toast.id)" class="td-toast-close">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
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
        title: toast.title || me.$t("i18nCommon.toastMessage.notiTitle"),
        message: toast.message || "",
        duration: toast.duration || 3000,
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
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 350px;
  max-width: calc(100vw - 40px);
  pointer-events: none;
}

.toast {
  font-size: var(--font-size-medium);
  background-color: var(--bg-main-color);
  border-radius: calc(var(--border-radius) * 1.5);

  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 60px;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  margin-top: 10px;
}

.td-toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.td-toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.td-toast-success .td-toast-icon {
  color: #10b981;
}

.td-toast-error .td-toast-icon {
  color: #ef4444;
}

.td-toast-warning .td-toast-icon {
  color: #f59e0b;
}

.td-toast-info .td-toast-icon {
  color: #3b82f6;
}

.td-toast-message {
  flex: 1;
  min-width: 0;
}

.td-toast-title {
  font-weight: 600;
  font-size: 17px;
  margin-bottom: 2px;
}

.td-toast-text {
  font-size: 17px;
}

.td-toast-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #9ca3af;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.td-toast-close:hover {
  background: #f3f4f6;
  color: #6b7280;
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
  transform: translateX(100%) scale(0.95);
}

.td-toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.td-toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive */
@media (max-width: 480px) {
  .td-toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    max-width: none;
  }

  .toast {
    padding: 12px;
  }

  .td-toast-title {
    font-size: 13px;
  }

  .td-toast-text {
    font-size: 12px;
  }
}
</style>
