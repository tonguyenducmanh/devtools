<template>
  <div
    class="td-slide-group"
    :class="{
      'layout-horizontal': layout === $tdEnum.coordinateAxes.horizontal,
      'layout-vertical': layout === $tdEnum.coordinateAxes.vertical,
      'td-slide-group-no-margin': noMargin,
    }"
  >
    <div class="td-slide-group-label" v-if="label">
      {{ label.capitalize() }}
    </div>
    <div v-if="options && options.length > 0" class="flex td-slide-group-area">
      <!-- Background slider cho selected item -->
      <div class="td-slide-background" :style="sliderStyle"></div>

      <div
        class="td-slide-item"
        :class="{ 'td-slide-item-selected': option.value == modelValue }"
        v-for="(option, index) in options"
        :key="index"
        :ref="(el) => setItemRef(el, index)"
        @click="changeSlideVal(option.value)"
      >
        <div
          v-if="showIcon"
          class="td-icon"
          :class="{
            [option.icon]: option.icon,
            'td-selected-icon': option.value == modelValue,
          }"
          v-tooltip="option.label"
        ></div>
        <span v-else>{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDslideGroup",
  props: {
    showIcon: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    options: {
      type: Array,
      default: () => [],
      required: true,
      validator: (options) =>
        options.every((option) => option.hasOwnProperty("value")),
    },
    layout: {
      type: String,
      default: tdEnum.coordinateAxes.horizontal,
      validator: (value) =>
        [
          tdEnum.coordinateAxes.horizontal,
          tdEnum.coordinateAxes.vertical,
        ].includes(value),
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      itemRefs: [],
      sliderStyle: {
        transform: "translateX(0px)",
        width: "0px",
        height: "0px",
      },
    };
  },
  computed: {
    generatedName() {
      return this.name || `td-slide-group-${this.$.uid}`;
    },
    selectedIndex() {
      return this.options.findIndex((opt) => opt.value === this.modelValue);
    },
    isVertical() {
      return this.layout === tdEnum.coordinateAxes.vertical;
    },
  },
  watch: {
    selectedIndex: {
      handler() {
        this.$nextTick(() => {
          this.updateSliderPosition();
        });
      },
      immediate: true,
    },
    layout() {
      this.$nextTick(() => {
        this.updateSliderPosition();
      });
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.updateSliderPosition();
    });
    window.addEventListener("resize", this.updateSliderPosition);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateSliderPosition);
  },
  methods: {
    setItemRef(el, index) {
      if (el) {
        this.itemRefs[index] = el;
      }
    },
    updateSliderPosition() {
      if (this.selectedIndex >= 0 && this.itemRefs[this.selectedIndex]) {
        const selectedEl = this.itemRefs[this.selectedIndex];
        const containerEl = selectedEl.parentElement;

        const containerRect = containerEl.getBoundingClientRect();
        const itemRect = selectedEl.getBoundingClientRect();

        if (this.isVertical) {
          // Vertical layout
          const offsetTop = itemRect.top - containerRect.top;
          const height = itemRect.height;

          this.sliderStyle = {
            transform: `translateY(${offsetTop}px)`,
            width: `${itemRect.width}px`,
            height: `${height}px`,
          };
        } else {
          // Horizontal layout
          const offsetLeft = itemRect.left - containerRect.left;
          const width = itemRect.width;

          this.sliderStyle = {
            transform: `translateX(${offsetLeft}px)`,
            width: `${width}px`,
            height: `${itemRect.height}px`,
          };
        }
      }
    },
    changeSlideVal(e) {
      this.$emit("update:modelValue", e);
      this.$emit("change", e);
    },
  },
};
</script>

<style lang="scss" scoped>
.td-slide-group {
  margin: var(--padding);

  .td-slide-group-label {
    margin-bottom: var(--padding);
    font-size: var(--font-size-l-medium);
    color: var(--text-secondary-color);
  }
}

.td-slide-group-no-margin {
  margin: unset;
}

.td-slide-group.layout-horizontal {
  display: flex;
  flex-direction: row;
  align-items: end;

  .td-slide-group-label {
    margin-bottom: 0;
    margin-right: var(--padding);
  }

  > div {
    margin-right: var(--padding-medium);

    &:last-child {
      margin-right: 0;
    }
  }
}

.td-slide-group.layout-vertical {
  display: flex;
  flex-direction: column;

  .td-slide-group-label {
    margin-bottom: var(--padding);
    margin-right: 0;
  }
}

.td-slide-group-area {
  position: relative;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  padding: 0;

  .td-slide-background {
    position: absolute;
    top: 0;
    left: 0;
    background-color: var(--focus-color);
    border-radius: var(--border-radius);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    z-index: 0;
  }

  .td-slide-item {
    position: relative;
    cursor: pointer;
    padding: calc(var(--padding) / 2) var(--padding);
    border-radius: var(--border-radius);
    z-index: 1;
    transition: color 0.2s ease;
  }

  .td-slide-item-selected {
    color: white;
  }
}

// Horizontal layout
.layout-horizontal .td-slide-group-area {
  flex-direction: row;
}

// Vertical layout
.layout-vertical .td-slide-group-area {
  flex-direction: column;
  align-items: stretch;
}

body[data-theme="dark"] .td-icon {
  filter: invert(20);
}

.td-selected-icon {
  filter: invert(100);
}
</style>
