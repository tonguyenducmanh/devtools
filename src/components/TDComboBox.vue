<template>
  <div class="flex no-select td-combobox" :class="{ 'flex-col': isLabelTop }">
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ label.capitalize() }}
    </div>

    <div class="td-combobox-wraper">
      <div
        class="td-combobox-control"
        :class="{ disabled }"
        :style="styleCombo"
        @click="toggle"
      >
        <span class="td-combobox-value">
          {{ selectedLabel }}
        </span>
        <span :class="{ 'td-combobox-arrow-open': open }">
          <svg class="arrow" viewBox="0 0 24 14">
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
      </div>
      <div v-if="open" class="td-combobox-dropdown">
        <TDComboBoxOption
          v-for="(option, index) in options"
          :key="index"
          :option="option"
          :selected="option.value === modelValue"
          @select="select"
          class="td-dropdown-item"
        >
          <slot name="option" :option="option">
            {{ option.label.capitalize() }}
          </slot>
        </TDComboBoxOption>
      </div>
    </div>
  </div>
</template>

<script>
import TDComboBoxOption from "./TDComboBoxOption.vue";

export default {
  name: "TDComboBox",
  components: { TDComboBoxOption },
  props: {
    label: {
      type: String,
      default: null,
    },
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: null,
    },
    options: {
      type: Array,
      required: true,
      validator: (options) => options.every((o) => o.hasOwnProperty("value")),
    },
    isLabelTop: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    width: {
      type: Number,
      default: 100,
    },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      open: false,
    };
  },
  computed: {
    selectedLabel() {
      const found = this.options.find((o) => o.value === this.modelValue);
      return found ? found.label.capitalize() : "Chọn giá trị";
    },
    styleCombo() {
      let me = this;
      let styleDynamicCombo = null;
      if (me.width) {
        styleDynamicCombo = {
          width: `${me.width}px`,
          "max-width": `${me.width}px`,
          "min-width": `${me.width}px`,
        };
      }
      return styleDynamicCombo;
    },
  },
  methods: {
    toggle() {
      if (this.disabled) return;
      this.open = !this.open;
    },
    select(value) {
      this.$emit("update:modelValue", value);
      this.open = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.td-combobox {
  position: relative;
  margin: var(--padding);
  .td-label {
    overflow-wrap: normal; /* Allows breaking long words */
    word-break: keep-all; /* For wider browser support */
    white-space: nowrap; /* Ensure wrapping is enabled */
    padding-right: var(--padding);
    font-size: var(--font-size-l-medium);
  }
  .td-label-top {
    padding-bottom: var(--padding);
  }
  .td-combobox-wraper {
    width: 100%;
    position: relative;
    .td-combobox-control {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--padding);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      cursor: pointer;
      background: var(--bg-main-color);

      &:hover {
        border-color: var(--btn-color);
        .arrow {
          color: var(--btn-color);
        }
      }

      &.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
    .td-combobox-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 10;
      width: 100%;
      margin-top: 4px;
      border: 1px solid var(--border-color);
      background: var(--bg-main-color);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-radius: var(--border-radius);
      .td-dropdown-item:first-child {
        border-radius: var(--border-radius) var(--border-radius) 0 0;
      }
      .td-dropdown-item:last-child {
        border-radius: 0 0 var(--border-radius) var(--border-radius);
      }
    }

    .arrow {
      width: 12px;
      height: 8px;
      color: var(--border-color);
    }
    .td-combobox-arrow-open {
      transform: rotate(180deg);
      color: var(--border-color);
      transition: transform 0.2s ease;
    }
  }
}
</style>
