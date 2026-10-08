<template>
  <teleport to="body">
    <div v-if="visible" class="tm-popup-overlay" @click.self="onOverlayClick">
      <div ref="popupEl" class="flex flex-col tm-popup-container" :style="computeStyle"
        :class="{ 'tm-popup-fullscreen-mode': isFullscreen }">
        <div v-if="showHeader" class="tm-popup-header" :class="{ 'tm-popup-draggable': draggable && !isFullscreen }"
          v-tooltip="draggable && !isFullscreen ? $t('i18nCommon.popup.drag') : ''" @mousedown="startDrag">
          <div class="tm-popup-title">{{ title }}</div>
          <div class="tm-popup-header-extra">
            <slot name="header" />
            <button v-if="showFullScreenHeaderIcon" class="tm-popup-close"
              v-tooltip="isFullscreen ? $t('i18nCommon.popup.exitFullscreen') : $t('i18nCommon.popup.fullscreen')"
              @click="toggleFullscreen">
              <div class="tm-icon" :class="isFullscreen ? 'tm-exit-full-screen-icon' : 'tm-full-screen-icon'"></div>
            </button>
            <button v-if="showCloseHeaderIcon" class="tm-popup-close" v-tooltip="$t('i18nCommon.popup.close')"
              @click="emitClose">
              <div class="tm-icon tm-close-icon"></div>
            </button>
          </div>
        </div>

        <div class="flex-one tm-popup-body">
          <slot />
        </div>

        <template v-if="resizable && !isFullscreen">
          <div class="tm-popup-resize tm-popup-resize-n" data-dir="n" v-tooltip="$t('i18nCommon.popup.resizeN')"
            @mousedown="onResizeStart"></div>
          <div class="tm-popup-resize tm-popup-resize-s" data-dir="s" v-tooltip="$t('i18nCommon.popup.resizeS')"
            @mousedown="onResizeStart"></div>
          <div class="tm-popup-resize tm-popup-resize-e" data-dir="e" v-tooltip="$t('i18nCommon.popup.resizeE')"
            @mousedown="onResizeStart"></div>
          <div class="tm-popup-resize tm-popup-resize-w" data-dir="w" v-tooltip="$t('i18nCommon.popup.resizeW')"
            @mousedown="onResizeStart"></div>
          <div class="tm-popup-resize tm-popup-resize-ne" data-dir="ne" v-tooltip="$t('i18nCommon.popup.resizeNE')"
            @mousedown="onResizeStart"></div>
          <div class="tm-popup-resize tm-popup-resize-nw" data-dir="nw" v-tooltip="$t('i18nCommon.popup.resizeNW')"
            @mousedown="onResizeStart"></div>
          <div class="tm-popup-resize tm-popup-resize-se" data-dir="se" v-tooltip="$t('i18nCommon.popup.resizeSE')"
            @mousedown="onResizeStart"></div>
          <div class="tm-popup-resize tm-popup-resize-sw" data-dir="sw" v-tooltip="$t('i18nCommon.popup.resizeSW')"
            @mousedown="onResizeStart"></div>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: "TMPopup",

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
      if (target.closest && target.closest(".tm-popup-close")) return;
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
.tm-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.tm-popup-container {
  background: var(--bg-main-color);
  border-radius: var(--border-radius);
  max-width: calc(100vw - var(--padding) * 2);
  max-height: calc(100vh - var(--padding) * 2);
  display: flex;
  flex-direction: column;
  position: relative;
}

.tm-popup-fullscreen-mode {
  position: fixed !important;
  top: var(--padding) !important;
  left: var(--padding) !important;
  width: calc(100vw - var(--padding) * 2) !important;
  height: calc(100vh - var(--padding) * 2) !important;
  max-width: none !important;
  max-height: none !important;
  z-index: 1001;
}

.tm-popup-header {
  padding: var(--padding);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--padding);
  width: 100%;
}

.tm-popup-draggable {
  cursor: move;
}

.tm-popup-header-extra {
  display: flex;
  align-items: center;
  gap: var(--padding);
}

.tm-popup-body {
  overflow-y: auto;
  width: 100%;
}

.tm-popup-close {
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

.tm-popup-close:hover {
  border: 1px solid var(--border-color);
  filter: grayscale(0);
}

/* Vùng kéo/resize */
.tm-popup-resize {
  position: absolute;
  z-index: 5;
}

.tm-popup-resize-n,
.tm-popup-resize-s {
  left: 8px;
  right: 8px;
  height: 6px;
  cursor: ns-resize;
}

.tm-popup-resize-n {
  top: -3px;
}

.tm-popup-resize-s {
  bottom: -3px;
}

.tm-popup-resize-e,
.tm-popup-resize-w {
  top: 8px;
  bottom: 8px;
  width: 6px;
  cursor: ew-resize;
}

.tm-popup-resize-e {
  right: -3px;
}

.tm-popup-resize-w {
  left: -3px;
}

.tm-popup-resize-ne,
.tm-popup-resize-sw {
  width: 14px;
  height: 14px;
  cursor: nesw-resize;
}

.tm-popup-resize-nw,
.tm-popup-resize-se {
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
}

.tm-popup-resize-nw {
  top: -5px;
  left: -5px;
}

.tm-popup-resize-ne {
  top: -5px;
  right: -5px;
}

.tm-popup-resize-sw {
  bottom: -5px;
  left: -5px;
}

.tm-popup-resize-se {
  bottom: -5px;
  right: -5px;
}
</style>