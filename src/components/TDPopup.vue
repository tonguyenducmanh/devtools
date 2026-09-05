<template>
  <teleport to="body">
    <div v-if="visible" class="td-popup-overlay" @click.self="onOverlayClick">
      <div
        ref="popupEl"
        class="flex flex-col td-popup-container"
        :style="computeStyle"
        :class="{ 'td-popup-fullscreen-mode': isFullscreen }"
      >
        <div
          v-if="showHeader"
          class="td-popup-header"
          :class="{ 'td-popup-draggable': draggable && !isFullscreen }"
          @mousedown="startDrag"
        >
          <div class="td-popup-title">{{ title }}</div>
          <div class="td-popup-header-extra">
            <slot name="header" />
            <button
              v-if="showFullScreenHeaderIcon"
              class="td-popup-close"
              v-tooltip="isFullscreen ? $t('i18nCommon.popup.exitFullscreen') : $t('i18nCommon.popup.fullscreen')"
              @click="toggleFullscreen"
            >
              <div class="td-icon"
                :class="isFullscreen ? 'td-exit-full-screen-icon' : 'td-full-screen-icon'"></div>
            </button>
            <button
              v-if="showCloseHeaderIcon"
              class="td-popup-close"
              v-tooltip="$t('i18nCommon.popup.close')"
              @click="emitClose"
            >
              <div class="td-icon td-close-icon"></div>
            </button>
          </div>
        </div>

        <div class="flex-one td-popup-body">
          <slot />
        </div>

        <template v-if="resizable && !isFullscreen">
          <div class="td-popup-resize td-popup-resize-n" data-dir="n" @mousedown="onResizeStart"></div>
          <div class="td-popup-resize td-popup-resize-s" data-dir="s" @mousedown="onResizeStart"></div>
          <div class="td-popup-resize td-popup-resize-e" data-dir="e" @mousedown="onResizeStart"></div>
          <div class="td-popup-resize td-popup-resize-w" data-dir="w" @mousedown="onResizeStart"></div>
          <div class="td-popup-resize td-popup-resize-ne" data-dir="ne" @mousedown="onResizeStart"></div>
          <div class="td-popup-resize td-popup-resize-nw" data-dir="nw" @mousedown="onResizeStart"></div>
          <div class="td-popup-resize td-popup-resize-se" data-dir="se" @mousedown="onResizeStart"></div>
          <div class="td-popup-resize td-popup-resize-sw" data-dir="sw" @mousedown="onResizeStart"></div>
        </template>
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
    showFullScreenHeaderIcon: {
      type: Boolean,
      default: true,
    },
    closeOnClickOverlay: {
      type: Boolean,
      default: true,
    },
    draggable: {
      type: Boolean,
      default: true,
    },
    resizable: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["close"],
  data() {
    return {
      isPositioned: false,
      isFullscreen: this.isFullPopup,
      posX: 0,
      posY: 0,
      sizeWidth: null,
      sizeHeight: null,
    };
  },
  computed: {
    computeStyle() {
      let styleBuild = {};
      if (!this.isFullscreen) {
        styleBuild.width = this.sizeWidth ? `${this.sizeWidth}px` : this.width;
        styleBuild.height = this.sizeHeight ? `${this.sizeHeight}px` : this.height;
      }
      if (this.isPositioned && !this.isFullscreen) {
        styleBuild.position = "fixed";
        styleBuild.left = `${this.posX}px`;
        styleBuild.top = `${this.posY}px`;
      }
      return styleBuild;
    },
  },
  methods: {
    emitClose() {
      this.$emit("close");
    },
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
    },
    onOverlayClick() {
      if (this.closeOnClickOverlay) {
        this.emitClose();
      }
    },

    // Chuyển popup sang fixed + đặt vị trí giữa màn hình (chỉ chạy 1 lần khi bắt đầu kéo/resize)
    positionPopup() {
      if (this.isPositioned || this.isFullscreen) return;
      const w = parseFloat(this.sizeWidth || this.width) || 800;
      const h = parseFloat(this.sizeHeight || this.height) || 500;
      this.posX = Math.max((window.innerWidth - w) / 2, 0);
      this.posY = Math.max((window.innerHeight - h) / 2, 0);
      this.isPositioned = true;
    },

    startDrag(e) {
      if (this.isFullscreen) return;
      const target = e.target;
      if (target.closest && target.closest(".td-popup-close")) return;
      e.preventDefault();
      this.positionPopup();

      const startX = e.clientX;
      const startY = e.clientY;
      const origX = this.posX;
      const origY = this.posY;
      this.setDragState("move");

      const onMove = (ev) => {
        this.posX = Math.min(
          Math.max(0, origX + ev.clientX - startX),
          window.innerWidth - 40,
        );
        this.posY = Math.min(
          Math.max(0, origY + ev.clientY - startY),
          window.innerHeight - 40,
        );
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        this.clearDragState();
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },

    onResizeStart(e) {
      if (this.isFullscreen) return;
      e.preventDefault();
      e.stopPropagation();
      const dir = e.currentTarget.getAttribute("data-dir");
      this.positionPopup();

      const startX = e.clientX;
      const startY = e.clientY;
      const origW = parseFloat(this.sizeWidth || this.width) || 800;
      const origH = parseFloat(this.sizeHeight || this.height) || 500;
      const origX = this.posX;
      const origY = this.posY;
      const minW = 300;
      const minH = 200;
      const isHorizontal = dir.includes("e") || dir.includes("w");
      this.setDragState(isHorizontal ? "ew-resize" : "ns-resize");

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let w = origW;
        let h = origH;
        let x = origX;
        let y = origY;

        if (dir.includes("e")) w = origW + dx;
        if (dir.includes("s")) h = origH + dy;

        if (dir.includes("w")) {
          w = Math.max(minW, origW - dx);
          x = Math.max(0, origX + (origW - w));
        }
        if (dir.includes("n")) {
          h = Math.max(minH, origH - dy);
          y = Math.max(0, origY + (origH - h));
        }

        w = Math.max(minW, w);
        h = Math.max(minH, h);
        if (dir.includes("e")) w = Math.min(w, window.innerWidth - x);
        if (dir.includes("s")) h = Math.min(h, window.innerHeight - y);

        this.sizeWidth = w;
        this.sizeHeight = h;
        this.posX = x;
        this.posY = y;
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        this.clearDragState();
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },

    setDragState(cursor) {
      if (this.$refs.popupEl) this.$refs.popupEl.style.cursor = cursor;
      document.body.style.cursor = cursor;
      document.body.style.userSelect = "none";
    },

    clearDragState() {
      if (this.$refs.popupEl) this.$refs.popupEl.style.cursor = "";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
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
  position: relative;
}

.td-popup-fullscreen-mode {
  position: fixed !important;
  top: var(--padding) !important;
  left: var(--padding) !important;
  width: calc(100vw - var(--padding) * 2) !important;
  height: calc(100vh - var(--padding) * 2) !important;
  max-width: none !important;
  max-height: none !important;
  z-index: 1001;
}

.td-popup-header {
  padding: var(--padding);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--padding);
  width: 100%;
}

.td-popup-draggable {
  cursor: move;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
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

/* Vùng kéo/resize */
.td-popup-resize {
  position: absolute;
  z-index: 5;
}
.td-popup-resize-n,
.td-popup-resize-s {
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: ns-resize;
}
.td-popup-resize-n {
  top: -3px;
}
.td-popup-resize-s {
  bottom: -3px;
}
.td-popup-resize-e,
.td-popup-resize-w {
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}
.td-popup-resize-e {
  right: -3px;
}
.td-popup-resize-w {
  left: -3px;
}
.td-popup-resize-ne,
.td-popup-resize-sw {
  width: 14px;
  height: 14px;
  cursor: nesw-resize;
}
.td-popup-resize-nw,
.td-popup-resize-se {
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
}
.td-popup-resize-nw {
  top: -5px;
  left: -5px;
}
.td-popup-resize-ne {
  top: -5px;
  right: -5px;
}
.td-popup-resize-sw {
  bottom: -5px;
  left: -5px;
}
.td-popup-resize-se {
  bottom: -5px;
  right: -5px;
}
</style>