<template>
  <teleport to="body">
    <div v-if="visible" class="td-popup-overlay" @click="onOverlayClick">
      <div class="td-popup-container" :style="{ width }" @click.stop>
        <div v-if="showHeader" class="td-popup-header">
          <h3 class="td-popup-title">{{ title }}</h3>
          <button v-if="closable" class="td-popup-close" @click="emitClose">
            ×
          </button>
        </div>

        <div class="td-popup-body" :style="{ maxHeight }">
          <slot />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: "TDPopup",

  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: "" },
    width: { type: String, default: "600px" },
    maxHeight: { type: String, default: "80vh" },
    showHeader: { type: Boolean, default: true },
    closable: { type: Boolean, default: true },
    closeOnClickOverlay: { type: Boolean, default: true },
  },

  emits: ["close"],

  methods: {
    emitClose() {
      this.$emit("close");
    },
    onOverlayClick() {
      if (this.closeOnClickOverlay) {
        this.emitClose();
      }
    },
  },
};
</script>

<style scoped>
.td-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.td-popup-container {
  background: var(--bg-main-color);
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.td-popup-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
}

.td-popup-body {
  padding: 16px;
  overflow-y: auto;
}

.td-popup-close {
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
}
</style>
