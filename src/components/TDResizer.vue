<template>
  <div
    class="td-resizer"
    :class="[`direction-${direction}`, { dragging: isDragging }]"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <div class="td-resizer-handle">
      <div class="td-resizer-line"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDResizer",
  props: {
    /**
     * Hướng resize: horizontal (ngang) hoặc vertical (dọc)
     */
    direction: {
      type: String,
      default: "horizontal",
      validator: (v) => ["horizontal", "vertical"].includes(v),
    },

    /**
     * Giá trị min cho phần bên trái/trên (%)
     */
    minSize: {
      type: Number,
      default: 5,
    },

    /**
     * Giá trị max cho phần bên trái/trên (%)
     */
    maxSize: {
      type: Number,
      default: 95,
    },
  },

  data() {
    return {
      isDragging: false,
      startPos: 0,
      currentSize: 50, // Giá trị mặc định 50%
    };
  },

  computed: {
    isHorizontal() {
      return this.direction === "horizontal";
    },
  },

  methods: {
    startDrag(e) {
      e.preventDefault();
      this.isDragging = true;

      // Lấy vị trí bắt đầu
      this.startPos = this.isHorizontal
        ? e.touches
          ? e.touches[0].clientX
          : e.clientX
        : e.touches
        ? e.touches[0].clientY
        : e.clientY;

      // Thêm event listeners
      document.addEventListener("mousemove", this.onDrag);
      document.addEventListener("mouseup", this.stopDrag);
      document.addEventListener("touchmove", this.onDrag);
      document.addEventListener("touchend", this.stopDrag);

      // Thêm class vào body để tránh select text khi drag
      document.body.style.userSelect = "none";
      document.body.style.cursor = this.isHorizontal
        ? "col-resize"
        : "row-resize";
    },

    onDrag(e) {
      if (!this.isDragging) return;

      e.preventDefault();

      // Lấy vị trí hiện tại
      const currentPos = this.isHorizontal
        ? e.touches
          ? e.touches[0].clientX
          : e.clientX
        : e.touches
        ? e.touches[0].clientY
        : e.clientY;

      // Lấy container cha
      const container = this.$el.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerSize = this.isHorizontal
        ? containerRect.width
        : containerRect.height;

      // Tính toán vị trí của resizer trong container
      const resizerPos = this.isHorizontal
        ? currentPos - containerRect.left
        : currentPos - containerRect.top;

      // Chuyển đổi sang %
      let newSize = (resizerPos / containerSize) * 100;

      // Giới hạn trong khoảng min-max
      newSize = Math.max(this.minSize, Math.min(this.maxSize, newSize));

      this.currentSize = newSize;

      // Emit sự kiện resize
      this.$emit("resize", {
        leftSize: newSize,
        rightSize: 100 - newSize,
      });
    },

    stopDrag() {
      this.isDragging = false;

      // Xóa event listeners
      document.removeEventListener("mousemove", this.onDrag);
      document.removeEventListener("mouseup", this.stopDrag);
      document.removeEventListener("touchmove", this.onDrag);
      document.removeEventListener("touchend", this.stopDrag);

      // Xóa style tạm
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    },
  },

  beforeUnmount() {
    // Cleanup khi component bị destroy
    this.stopDrag();
  },
};
</script>

<style scoped>
.td-resizer {
  position: relative;
  background: transparent;
  z-index: 5;
  flex-shrink: 0;
}

/* Horizontal resizer */
.direction-horizontal {
  width: 8px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

.direction-horizontal .td-resizer-handle {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.direction-horizontal .td-resizer-line {
  width: 2px;
  height: 40px;
  background: var(--border-color);
  border-radius: 2px;
  transition: all 0.2s ease;
}

/* Vertical resizer */
.direction-vertical {
  height: 8px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

.direction-vertical .td-resizer-handle {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.direction-vertical .td-resizer-line {
  width: 40px;
  height: 2px;
  background: var(--border-color);
  border-radius: 2px;
  transition: all 0.2s ease;
}

/* Hover states */
.td-resizer:hover .td-resizer-line,
.td-resizer.dragging .td-resizer-line {
  background: var(--focus-color);
}

.direction-horizontal:hover .td-resizer-line,
.direction-horizontal.dragging .td-resizer-line {
  height: 60px;
}

.direction-vertical:hover .td-resizer-line,
.direction-vertical.dragging .td-resizer-line {
  width: 60px;
}

/* Active dragging state */
.td-resizer.dragging {
  background: rgba(var(--focus-color, 66, 133, 244), 0.1);
}
</style>
