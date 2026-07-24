<template>
  <teleport to="body">
    <div v-if="visible" class="td-popup-overlay" @click.self="onOverlayClick">
      <div
        class="flex flex-col td-popup-container"
        :style="computeStyle"
        :class="{ 'td-popup-full-screen': isFullPopup }"
      >
        <div v-if="showHeader" class="td-popup-header">
          <div class="td-popup-title">{{ title }}</div>
          <div class="td-popup-header-extra">
            <slot name="header" />
            <button
              v-if="showCloseHeaderIcon"
              class="td-popup-close"
              @click="emitClose"
            >
              <div class="td-icon td-close-icon"></div>
            </button>
          </div>
        </div>

        <div class="flex-one td-popup-body">
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
      default: "800px",
    },
    height: {
      type: String,
      default: "500px",
    },
    isFullPopup: {
      type: Boolean,
      default: false,
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    showCloseHeaderIcon: {
      type: Boolean,
      default: true,
    },
    closeOnClickOverlay: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["close"],
  computed: {
    computeStyle() {
      let styleBuild = {};
      if (!this.isFullPopup) {
        styleBuild.width = this.width;
        styleBuild.height = this.height;
      }
      return styleBuild;
    },
  },
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
  border-radius: var(--border-radius);
  max-width: calc(100vw - var(--padding) * 2);
  max-height: calc(100vh - var(--padding) * 2);
  display: flex;
  flex-direction: column;
}

.td-popup-full-screen {
  width: calc(100vw - var(--padding) * 2);
  height: calc(100vh - var(--padding) * 2);
}

.td-popup-header {
  padding: calc(var(--padding) * 2);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--padding);
  width: 100%;
}
.td-popup-header-extra {
  display: flex;
  align-items: center;
  gap: var(--padding);
}

.td-popup-body {
  overflow-y: auto;
  width: 100%;
}

.td-popup-close {
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  background: none;
  font-size: 24px;
  cursor: pointer;
  filter: grayscale(100);
}
.td-popup-close:hover {
  border: 1px solid var(--border-color);
  filter: grayscale(0);
}
</style>
