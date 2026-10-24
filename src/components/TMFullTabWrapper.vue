<template>
  <div class="tm-full-tab-wrapper" :class="{ 'tm-full-tab-wrapper-active': modelValue }" :style="wrapperStyle">
    <div
      ref="toolbarRef"
      class="fullscreen-toolbar"
      :class="{
        'toolbar-pinned': isToolbarPinned && !hasCustomPosition,
        'toolbar-dragging': isDragging,
        'toolbar-dragged': hasCustomPosition
      }"
      :style="toolbarStyle"
      v-if="modelValue || alwaysShowToolbar"
      @mousedown="onToolbarMouseDown"
    >
      <div v-tooltip="!isDragging ? $t('i18nCommon.tmfulltab.dragToolbar') : ''" class="flex toolbar-btn toolbar-drag-handle">
        <span class="tm-icon tm-drag-icon"></span>
      </div>
      <template v-if="!hidePin">
        <template v-if="isToolbarPinned && !hasCustomPosition">
          <div v-tooltip="unpinTooltip || $t('i18nCommon.remoteDesktop.unpin')" class="flex toolbar-btn"
            @click.stop="unpinToolbar">
            <span class="tm-icon tm-unpin-icon"></span>
          </div>
        </template>
        <template v-else>
          <div v-tooltip="pinTooltip || $t('i18nCommon.remoteDesktop.pin')" class="flex toolbar-btn"
            @click.stop="pinToolbar">
            <span class="tm-icon tm-pin-icon"></span>
          </div>
        </template>
      </template>

      <div class="flex tm-toolbar-utility-area">
        <slot name="toolbar-left"></slot>
        <template v-if="modelValue">
          <div v-tooltip="exitFullScreenTooltip || $t('i18nCommon.remoteDesktop.closeFullTab')" class="flex toolbar-btn"
            @click.stop="toggleFullScreen">
            <span class="tm-icon tm-exit-full-screen-icon"></span>
          </div>
        </template>
        <template v-else>
          <div v-tooltip="fullScreenTooltip || $t('i18nCommon.remoteDesktop.fullTab')" class="flex toolbar-btn"
            @click.stop="toggleFullScreen">
            <span class="tm-icon tm-full-screen-icon"></span>
          </div>
        </template>
        <slot name="toolbar-right"></slot>
      </div>
    </div>

    <div class="tm-full-tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "TMFullTabWrapper",
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    alwaysShowToolbar: {
      type: Boolean,
      default: false
    },
    fullScreenBgColor: {
      type: String,
      default: "var(--bg-main-color)"
    },
    pinTooltip: {
      type: String,
      default: ""
    },
    unpinTooltip: {
      type: String,
      default: ""
    },
    fullScreenTooltip: {
      type: String,
      default: ""
    },
    exitFullScreenTooltip: {
      type: String,
      default: ""
    },
    hidePin: {
      type: Boolean,
      default: false
    },
    defaultPinned: {
      type: Boolean,
      default: true
    },
    draggable: {
      type: Boolean,
      default: true
    },
    savePosition: {
      type: Boolean,
      default: false
    },
    positionKey: {
      type: String,
      default: "tm-full-tab-wrapper-toolbar"
    }
  },
  data() {
    return {
      isToolbarPinned: !this.hidePin && this.defaultPinned,
      toolbarLeft: null,
      toolbarTop: null,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragStartLeft: 0,
      dragStartTop: 0
    };
  },
  computed: {
    wrapperStyle() {
      if (this.modelValue) {
        return { backgroundColor: this.fullScreenBgColor };
      }
      return {};
    },
    hasCustomPosition() {
      return this.toolbarLeft !== null && this.toolbarTop !== null;
    },
    toolbarStyle() {
      if (this.isToolbarPinned && !this.hasCustomPosition) {
        return {};
      }
      if (this.hasCustomPosition) {
        return {
          left: this.toolbarLeft + "px",
          top: this.toolbarTop + "px",
          transform: "none"
        };
      }
      return {};
    }
  },
  mounted() {
    if (this.savePosition && !this.isToolbarPinned) {
      this.restorePosition();
    }
  },
  beforeUnmount() {
    this.removeDragListeners();
  },
  methods: {
    pinToolbar() {
      this.isToolbarPinned = true;
      this.toolbarLeft = null;
      this.toolbarTop = null;
      if (this.savePosition) {
        try {
          localStorage.removeItem(this.getPositionStorageKey());
        } catch (e) {
          // ignore
        }
      }
    },
    unpinToolbar() {
      this.isToolbarPinned = false;
      if (this.savePosition) {
        this.restorePosition();
      }
    },
    toggleFullScreen() {
      this.$emit("update:modelValue", !this.modelValue);
      if (this.modelValue && document.fullscreenElement) {
        document.exitFullscreen();
      }
      this.$nextTick(() => {
        if (!this.isToolbarPinned && this.savePosition) {
          this.restorePosition();
        }
      });
    },
    getPositionStorageKey() {
      return this.positionKey + (this.modelValue ? "-fullscreen" : "-normal");
    },
    restorePosition() {
      if (!this.savePosition) return;
      try {
        const raw = localStorage.getItem(this.getPositionStorageKey());
        if (!raw) return;
        const pos = JSON.parse(raw);
        if (typeof pos.left === "number" && typeof pos.top === "number") {
          this.toolbarLeft = pos.left;
          this.toolbarTop = pos.top;
          this.clampToolbarPosition();
        }
      } catch (e) {
        // ignore
      }
    },
    savePositionToStorage() {
      if (!this.savePosition || !this.hasCustomPosition) return;
      try {
        localStorage.setItem(
          this.getPositionStorageKey(),
          JSON.stringify({ left: this.toolbarLeft, top: this.toolbarTop })
        );
      } catch (e) {
        // ignore
      }
    },
    clampToolbarPosition() {
      this.$nextTick(() => {
        const toolbarEl = this.$refs.toolbarRef;
        const wrapperEl = this.$el;
        if (!toolbarEl || !wrapperEl) return;
        const toolbarRect = toolbarEl.getBoundingClientRect();
        const wrapperRect = wrapperEl.getBoundingClientRect();
        let left = this.toolbarLeft;
        let top = this.toolbarTop;
        const maxLeft = wrapperRect.width - toolbarRect.width - 4;
        const maxTop = wrapperRect.height - toolbarRect.height - 4;
        if (left < 4) left = 4;
        if (top < 4) top = 4;
        if (maxLeft > 4 && left > maxLeft) left = maxLeft;
        if (maxTop > 4 && top > maxTop) top = maxTop;
        this.toolbarLeft = left;
        this.toolbarTop = top;
      });
    },
    onToolbarMouseDown(e) {
      if (!this.draggable) return;
      if (e.button !== 0) return;
      const target = e.target;
      const isDragHandle = target.closest(".toolbar-drag-handle");
      if (!isDragHandle && target.closest(".toolbar-btn")) return;
      if (!isDragHandle) return;
      e.preventDefault();
      const toolbarEl = this.$refs.toolbarRef;
      const wrapperEl = this.$el;
      if (!toolbarEl || !wrapperEl) return;
      const toolbarRect = toolbarEl.getBoundingClientRect();
      const wrapperRect = wrapperEl.getBoundingClientRect();
      if (this.isToolbarPinned && !this.hasCustomPosition) {
        this.isToolbarPinned = false;
      }
      if (!this.hasCustomPosition) {
        this.toolbarLeft = toolbarRect.left - wrapperRect.left;
        this.toolbarTop = toolbarRect.top - wrapperRect.top;
      }
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.dragStartLeft = this.toolbarLeft;
      this.dragStartTop = this.toolbarTop;
      document.addEventListener("mousemove", this.onToolbarMouseMove);
      document.addEventListener("mouseup", this.onToolbarMouseUp);
    },
    onToolbarMouseMove(e) {
      if (!this.isDragging) return;
      e.preventDefault();
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      let newLeft = this.dragStartLeft + dx;
      let newTop = this.dragStartTop + dy;
      const toolbarEl = this.$refs.toolbarRef;
      const wrapperEl = this.$el;
      if (toolbarEl && wrapperEl) {
        const toolbarRect = toolbarEl.getBoundingClientRect();
        const wrapperRect = wrapperEl.getBoundingClientRect();
        const maxLeft = wrapperRect.width - toolbarRect.width - 4;
        const maxTop = wrapperRect.height - toolbarRect.height - 4;
        if (newLeft < 4) newLeft = 4;
        if (newTop < 4) newTop = 4;
        if (maxLeft > 4 && newLeft > maxLeft) newLeft = maxLeft;
        if (maxTop > 4 && newTop > maxTop) newTop = maxTop;
      }
      this.toolbarLeft = newLeft;
      this.toolbarTop = newTop;
    },
    onToolbarMouseUp() {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.removeDragListeners();
      this.savePositionToStorage();
    },
    removeDragListeners() {
      document.removeEventListener("mousemove", this.onToolbarMouseMove);
      document.removeEventListener("mouseup", this.onToolbarMouseUp);
    }
  }
};
</script>

<style scoped lang="scss">
.tm-full-tab-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tm-full-tab-wrapper-active {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 1000 !important;
  height: 100% !important;
}

.tm-full-tab-content {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.fullscreen-toolbar {
  position: absolute;
  top: 0;
  left: 50%;
  display: flex;
  gap: 4px;
  background-color: var(--bg-layer-color);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  padding: 4px;
  transition: all 0.3s ease-in-out;
  z-index: 1001;
  transform: translateX(-50%) translateY(calc(-100% + 8px));
  opacity: 0.6;
  pointer-events: none;
  user-select: none;
  touch-action: none;

  &:hover {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
  }

  &.toolbar-pinned {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }

  &.toolbar-dragged {
    transform: none;
    border-radius: var(--border-radius);
    pointer-events: auto;

    &:hover {
      transform: none;
    }
  }

  &.toolbar-dragging {
    transition: none;
    opacity: 1;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    pointer-events: auto;
  }

  .toolbar-drag-handle {
    cursor: grab;

    &:hover {
      background-color: var(--focus-color);
      color: var(--selected-item-text-color);
      box-shadow: inset 0 0 0 1px var(--border-color);
    }
  }

  &.toolbar-dragging .toolbar-drag-handle {
    cursor: grabbing;
  }

  :deep(.toolbar-btn) {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;
    pointer-events: auto;

    &:hover {
      background-color: var(--focus-color);
      color: var(--selected-item-text-color);
      box-shadow: inset 0 0 0 1px var(--border-color);
    }
  }

  .tm-toolbar-utility-area {
    gap: var(--padding);
    pointer-events: auto;
  }
}
</style>
