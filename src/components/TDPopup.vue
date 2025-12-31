<template>
  <teleport to="body">
    <transition name="td-popup-fade">
      <div v-if="visible" class="td-popup-overlay" @click="handleOverlayClick">
        <transition name="td-popup-slide">
          <div
            v-if="visible"
            class="td-popup-container"
            :class="containerClass"
            :style="containerStyle"
            @click.stop
          >
            <!-- Header -->
            <div v-if="showHeader" class="td-popup-header">
              <slot name="header">
                <h3 class="td-popup-title">{{ title }}</h3>
              </slot>
              <button
                v-if="closable"
                class="td-popup-close"
                @click="handleClose"
              >
                <span>&times;</span>
              </button>
            </div>

            <!-- Body -->
            <div class="td-popup-body" :style="bodyStyle">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div v-if="showFooter" class="td-popup-footer">
              <slot name="footer">
                <button
                  class="td-popup-btn td-popup-btn-cancel"
                  @click="handleCancel"
                >
                  {{ cancelText }}
                </button>
                <button
                  class="td-popup-btn td-popup-btn-confirm"
                  @click="handleConfirm"
                >
                  {{ confirmText }}
                </button>
              </slot>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: "TDPopup",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "",
    },
    width: {
      type: String,
      default: "600px",
    },
    maxHeight: {
      type: String,
      default: "80vh",
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    showFooter: {
      type: Boolean,
      default: false,
    },
    closable: {
      type: Boolean,
      default: true,
    },
    closeOnClickOverlay: {
      type: Boolean,
      default: true,
    },
    confirmText: {
      type: String,
      default: "Xác nhận",
    },
    cancelText: {
      type: String,
      default: "Hủy",
    },
  },
  computed: {
    containerClass() {
      return "";
    },
    containerStyle() {
      return {
        width: this.width,
      };
    },
    bodyStyle() {
      return {
        maxHeight: this.maxHeight,
      };
    },
  },
  watch: {
    visible(val) {
      if (val) {
        document.body.style.overflow = "hidden";
        this.$emit("open");
      } else {
        document.body.style.overflow = "";
        this.$emit("closed");
      }
    },
  },
  beforeUnmount() {
    document.body.style.overflow = "";
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
      this.$emit("close");
    },
    handleConfirm() {
      this.$emit("confirm");
    },
    handleCancel() {
      this.$emit("cancel");
      this.handleClose();
    },
    handleOverlayClick() {
      if (this.closeOnClickOverlay) {
        this.handleClose();
      }
    },
  },
};
</script>

<style scoped>
.td-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.td-popup-container {
  background: var(--bg-main-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  max-height: 90vh;
}

.td-popup-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.td-popup-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.td-popup-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-color-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.td-popup-close:hover {
  background-color: var(--bg-layer-color);
  color: var(--text-color);
}

.td-popup-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.td-popup-body::-webkit-scrollbar {
  width: 6px;
}

.td-popup-body::-webkit-scrollbar-track {
  background: var(--bg-layer-color);
  border-radius: 3px;
}

.td-popup-body::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.td-popup-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-secondary);
}

.td-popup-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.td-popup-btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  min-width: 80px;
}

.td-popup-btn-cancel {
  background: var(--bg-main-color);
  color: var(--text-color);
  border-color: var(--border-color);
}

.td-popup-btn-cancel:hover {
  background-color: var(--bg-layer-color);
}

.td-popup-btn-confirm {
  background: var(--focus-color);
  color: #ffffff;
  border-color: var(--focus-color);
}

.td-popup-btn-confirm:hover {
  opacity: 0.9;
}

/* Animations */
.td-popup-fade-enter-active,
.td-popup-fade-leave-active {
  transition: opacity 0.3s ease;
}

.td-popup-fade-enter-from,
.td-popup-fade-leave-to {
  opacity: 0;
}

.td-popup-slide-enter-active,
.td-popup-slide-leave-active {
  transition: all 0.3s ease;
}

.td-popup-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.td-popup-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .td-popup-container {
    width: 100% !important;
    max-width: 100vw;
    margin: 0;
  }

  .td-popup-overlay {
    padding: 0;
  }
}
</style>
