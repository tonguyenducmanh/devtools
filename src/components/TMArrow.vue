<template>
  <span class="tm-arrow-wrapper">
    <svg class="tm-arrow" :style="styleArrowDirection" viewBox="0 0 24 14">
      <path
        d="M2 2 L12 12 L22 2"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>

<script>
import tmEnum from "@/common/TMEnum.js";
export default {
  name: "TMArrow",
  props: {
    openProp: {
      type: Boolean,
      default: false,
    },
    arrowDirection: {
      type: Number,
      default: tmEnum.Direction.bottom,
    },
    arrowOpenDirection: {
      type: Number,
      default: tmEnum.Direction.top,
    },
  },
  data() {
    return {
      open: false,
    };
  },
  methods: {},
  computed: {
    /**
     * style cho arrow
     */
    styleArrowDirection() {
      let me = this;
      let currentStyleArrow = {
        transition: `transform 0.2s ease`,
      };
      let currentDirection = me.arrowDirection;
      if (me.openProp) {
        currentDirection = me.arrowOpenDirection;
      }
      switch (currentDirection) {
        case tmEnum.Direction.top:
          currentStyleArrow.transform = "rotate(-180deg)";
          break;
        case tmEnum.Direction.left:
          currentStyleArrow.transform = "rotate(90deg)";
          break;
        case tmEnum.Direction.bottom:
          currentStyleArrow.transform = "rotate(0deg)";
          break;
        case tmEnum.Direction.right:
          currentStyleArrow.transform = "rotate(-90deg)";
          break;
        default:
          break;
      }
      return currentStyleArrow;
    },
  },
};
</script>

<style lang="scss" scoped>
.tm-arrow-wrapper {
  .tm-arrow {
    width: 12px;
    height: 12px;
    color: var(--text-primary-color);
  }
  .tm-arrow:hover {
    color: var(--btn-color);
  }
}
</style>
