<template>
  <button
    class="td-toggle-sidebar"
    :class="[`pos-${position}`, `attach-${attach}`, { collapsed }]"
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
  name: "TDToggleArea",
  components: { TDArrow },
  props: {
    /**
     * Sidebar đang mở hay đóng
     */
    collapsed: {
      type: Boolean,
      default: false,
    },

    /**
     * Sidebar nằm bên nào
     * left | right
     */
    position: {
      type: String,
      default: "left",
      validator: (v) => ["left", "right"].includes(v),
    },

    /**
     * Nút gắn ở đâu
     * middle | top | bottom
     */
    attach: {
      type: String,
      default: "middle",
      validator: (v) => ["top", "middle", "bottom"].includes(v),
    },
  },

  computed: {
    arrowOpenDirection() {
      if (this.position === "left") {
        return tdEnum.Direction.right;
      } else;
      {
        return tdEnum.Direction.left;
      }
    },
    arrowDirection() {
      if (this.position === "left") {
        return tdEnum.Direction.left;
      } else;
      {
        return tdEnum.Direction.right;
      }
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
.td-toggle-sidebar {
  position: absolute;
  z-index: 10;
  width: 20px;
  height: 48px;
  background: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.td-toggle-sidebar:hover {
  border-color: var(--btn-color);
}

/* ===== Position LEFT / RIGHT ===== */

.pos-left {
  left: calc(100% - var(--padding));
}

.pos-right {
  right: calc(100% - var(--padding));
}

/* ===== Attach TOP / MIDDLE / BOTTOM ===== */

.attach-top {
  top: 12px;
}

.attach-middle {
  top: 50%;
  transform: translateY(-50%);
}

.attach-bottom {
  bottom: 12px;
}
</style>
