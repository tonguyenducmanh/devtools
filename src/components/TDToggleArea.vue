<template>
  <button
    class="td-toggle-button"
    :class="[`edge-${edge}`, `align-${align}`, { collapsed }]"
    :style="customStyle"
    @click="onToggle"
  >
    <TDArrow
      :openProp="collapsed"
      :arrowOpenDirection="arrowOpenDirection"
      :arrowDirection="arrowDirection"
    />
  </button>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";
import TDArrow from "@/components/TDArrow.vue";

export default {
  name: "TDToggleButton",
  components: { TDArrow },

  props: {
    /**
     * Element đang mở hay đóng
     */
    collapsed: {
      type: Boolean,
      default: false,
    },

    /**
     * Cạnh nào của element cha
     * top | right | bottom | left
     */
    edge: {
      type: String,
      default: "left",
      validator: (v) => ["top", "right", "bottom", "left"].includes(v),
    },

    /**
     * Căn chỉnh nút trên cạnh
     * start | center | end
     */
    align: {
      type: String,
      default: "center",
      validator: (v) => ["start", "center", "end"].includes(v),
    },

    /**
     * Khoảng cách từ mép (px hoặc CSS value)
     */
    offset: {
      type: [Number, String],
      default: 12,
    },

    /**
     * Kích thước nút (px)
     * Object: { width, height } hoặc Number (tự động điều chỉnh theo hướng)
     */
    size: {
      type: [Number, Object],
      default: () => ({ width: 20, height: 48 }),
    },

    /**
     * Padding để nút nhô ra ngoài element cha
     */
    padding: {
      type: [Number, String],
      default: 10,
    },
  },

  computed: {
    /**
     * Xác định hướng mũi tên khi đóng
     * (Vì top/bottom bị xoay 90 độ nên cần dùng left/right)
     */
    arrowDirection() {
      const directionMap = {
        top: tdEnum.Direction.left, // Xoay 90° => trái thành lên
        right: tdEnum.Direction.right,
        bottom: tdEnum.Direction.left, // Xoay 90° => trái thành xuống
        left: tdEnum.Direction.left,
      };
      return directionMap[this.edge];
    },

    /**
     * Xác định hướng mũi tên khi mở
     * (Vì top/bottom bị xoay 90 độ nên cần dùng left/right)
     */
    arrowOpenDirection() {
      const directionMap = {
        top: tdEnum.Direction.left, // Xoay 90° => phải thành xuống
        right: tdEnum.Direction.left,
        bottom: tdEnum.Direction.right, // Xoay 90° => phải thành lên
        left: tdEnum.Direction.right,
      };
      return directionMap[this.edge];
    },

    /**
     * Xác định xem cạnh là ngang hay dọc
     */
    isHorizontalEdge() {
      return ["top", "bottom"].includes(this.edge);
    },

    /**
     * Tính toán kích thước nút
     */
    buttonSize() {
      if (typeof this.size === "number") {
        return this.isHorizontalEdge
          ? { width: this.size, height: 20 }
          : { width: 20, height: this.size };
      }
      return this.size;
    },

    /**
     * Tính toán offset
     */
    offsetValue() {
      return typeof this.offset === "number" ? `${this.offset}px` : this.offset;
    },

    /**
     * Tính toán padding
     */
    paddingValue() {
      return typeof this.padding === "number"
        ? `${this.padding}px`
        : this.padding;
    },

    /**
     * Style tùy chỉnh cho nút
     */
    customStyle() {
      return {
        width: `${this.buttonSize.width}px`,
        height: `${this.buttonSize.height}px`,
        "--offset": this.offsetValue,
        "--padding": this.paddingValue,
      };
    },
  },

  methods: {
    onToggle() {
      this.$emit("toggle");
    },
  },
};
</script>

<style scoped>
.td-toggle-button {
  position: absolute;
  z-index: 10;
  background: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  outline: none;
  transition: all 0.2s ease;
}

.td-toggle-button:hover {
  border-color: var(--btn-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* ===== EDGE: LEFT ===== */
.edge-left {
  left: calc(100% - var(--padding));
  top: var(--offset);
}

.edge-left.align-center {
  top: 50%;
  transform: translateY(-50%);
}

.edge-left.align-end {
  top: auto;
  bottom: var(--offset);
}

/* ===== EDGE: RIGHT ===== */
.edge-right {
  right: calc(100% - var(--padding));
  top: var(--offset);
}

.edge-right.align-center {
  top: 50%;
  transform: translateY(-50%);
}

.edge-right.align-end {
  top: auto;
  bottom: var(--offset);
}

/* ===== EDGE: TOP ===== */
.edge-top {
  top: calc(100% - var(--padding));
  left: var(--offset);
  transform: rotate(90deg);
  transform-origin: center;
}

.edge-top.align-center {
  left: 50%;
  transform: translateX(-50%) rotate(90deg);
}

.edge-top.align-end {
  left: auto;
  right: var(--offset);
  transform: rotate(90deg);
}

/* ===== EDGE: BOTTOM ===== */
.edge-bottom {
  bottom: calc(100% - var(--padding));
  left: var(--offset);
  transform: rotate(90deg);
  transform-origin: center;
}

.edge-bottom.align-center {
  left: 50%;
  transform: translateX(-50%) rotate(90deg);
}

.edge-bottom.align-end {
  left: auto;
  right: var(--offset);
  transform: rotate(90deg);
}

/* Animation khi collapsed */
.td-toggle-button.collapsed {
  opacity: 0.8;
}
</style>
