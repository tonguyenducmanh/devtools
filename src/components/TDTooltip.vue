<template>
  <span
    class="td-tooltip-wrapper"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @mousemove="onMove"
    ref="wrapper"
  >
    <slot />

    <div
      v-if="visible && formattedText"
      ref="tooltip"
      class="td-tooltip"
      :style="tooltipStyle"
    >
      {{ formattedText }}
    </div>
  </span>
</template>

<script>
export default {
  name: "TDTooltip",

  props: {
    title: {
      type: String,
      required: true,
    },
    maxCharsPerLine: {
      type: Number,
      default: 40, // n ký tự sẽ xuống dòng
    },
    offset: {
      type: Number,
      default: 12,
    },
    maxWidth: {
      type: String,
      default: "300px",
    },
  },

  data() {
    return {
      visible: false,
      mouseX: 0,
      mouseY: 0,
      tooltipStyle: {},
    };
  },

  computed: {
    formattedText() {
      if (!this.title) return "";

      return this.title;
    },
  },

  methods: {
    onEnter(e) {
      this.visible = true;
      this.$nextTick(() => {
        this.updatePosition(e);
      });
    },

    onLeave() {
      this.visible = false;
    },

    onMove(e) {
      this.updatePosition(e);
    },

    updatePosition(e) {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      const tooltipEl = this.$refs.tooltip;
      if (!tooltipEl) return;

      const tooltipRect = tooltipEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = this.mouseX + this.offset;
      let top = this.mouseY + this.offset;

      // Tràn phải
      if (left + tooltipRect.width > viewportWidth) {
        left = this.mouseX - tooltipRect.width - this.offset;
      }

      // Tràn dưới
      if (top + tooltipRect.height > viewportHeight) {
        top = this.mouseY - tooltipRect.height - this.offset;
      }

      // Tràn trái
      if (left < 0) left = this.offset;

      // Tràn trên
      if (top < 0) top = this.offset;

      this.tooltipStyle = {
        left: `${left}px`,
        top: `${top}px`,
        "max-width": this.maxWidth,
      };
    },
  },
};
</script>

<style scoped>
.td-tooltip-wrapper {
  display: inline-block;
  position: relative;
}

.td-tooltip {
  position: fixed;
  z-index: 9999;

  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;

  font-size: 12px;
  line-height: 1.4;

  border-radius: 6px;
  word-wrap: break-word;
  line-break: auto;
  white-space: normal;
  overflow-wrap: anywhere; /* ép URL dài tự xuống dòng */
  pointer-events: none;

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: td-tooltip-fade 0.15s ease;
}

@keyframes td-tooltip-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
