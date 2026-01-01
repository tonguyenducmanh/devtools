<template>
  <span
    class="td-checkbox-container"
    :class="{ 'td-checkbox-read-only': readOnly }"
  >
    <label
      class="td-label no-select"
      :class="{ 'td-label-checked': modelValue }"
    >
      <input
        type="checkbox"
        :checked="modelValue"
        @input="changeInputValue"
        :disabled="readOnly || variant == $tdEnum.checkboxType.switch"
        :name="inputId"
      />
      <span
        v-if="variant == $tdEnum.checkboxType.checkbox"
        class="flex td-checkbox-visible"
      >
        <span class="td-checkbox">
          <span v-if="modelValue" class="td-checkbox-active"></span>
        </span>
        <span class="td-label-content">{{ label.capitalize() }}</span>
      </span>
      <span
        v-else-if="variant == $tdEnum.checkboxType.switch"
        class="flex td-checkbox-visible td-switch-layout"
      >
        <span class="td-label-content">{{ label.capitalize() }}</span>
        <button
          type="button"
          class="td-theme-toggle-switch"
          :class="{ 'td-switch-dark': modelValue }"
          @click.prevent="toggleSwitch"
        >
          <span class="td-switch-track">
            <span class="td-switch-thumb"></span>
          </span>
        </button>
      </span>
    </label>
  </span>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDCheckbox",
  created() {},
  mounted() {},
  methods: {},
  computed: {
    inputId() {
      return `td-radio-group-${this.$.uid}`;
    },
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    variant: {
      type: Number,
      default: tdEnum.checkboxType.checkbox,
    },
    width: {
      type: String,
      default: "100%",
    },
  },
  data() {
    return {
      value: null,
    };
  },
  watch: {},
  methods: {
    changeInputValue(e) {
      let me = this;
      me.$emit("update:modelValue", e.target.checked);
      me.$emit("change", e.target.checked);
    },
    toggleSwitch() {
      let me = this;
      if (!me.readOnly) {
        const newValue = !me.modelValue;
        me.$emit("update:modelValue", newValue);
        me.$emit("change", newValue);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.td-checkbox-container {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--padding);
  box-sizing: border-box;
  width: 100%;

  .td-label {
    width: 100%;
    justify-content: flex-start;
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  input {
    opacity: 0;
    width: 0%;
    position: absolute;
  }

  .td-checkbox {
    top: 0;
    left: 0;
    transition: all 0.2s ease;
    transform: rotate(-90deg);
    cursor: pointer;
    position: relative;
    display: block;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    border: 1px solid var(--border-color);
    background: var(--bg-main-color);
  }

  .td-checkbox-visible {
    justify-content: space-between;
    width: 100%;
    align-items: center;

    &.td-switch-layout {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--padding);
    }
  }

  .td-label-content {
    white-space: nowrap;
  }

  // Switch styles - giống TDHeader
  .td-theme-toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    outline: none;
    flex-shrink: 0;

    .td-switch-track {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: var(--bg-layer-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      display: block;
    }

    &:hover .td-switch-track {
      border: 1px solid var(--focus-color);
    }

    .td-switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background-color: var(--bg-main-color);
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--border-color);
    }

    // Dark mode state (checked)
    &.td-switch-dark {
      .td-switch-track {
        background-color: var(--btn-secondary-color);
      }

      .td-switch-thumb {
        transform: translateX(24px);
        background-color: var(--btn-color);
        border-color: var(--btn-color);
      }
    }

    // Hover effects
    &:hover {
      .td-switch-track {
        transform: scale(1.02);
      }

      .td-switch-thumb {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      }
    }

    &:active {
      .td-switch-track {
        transform: scale(0.98);
      }
    }
  }
}

.td-label-checked .td-checkbox {
  border: 1px solid var(--btn-color);
  transform: rotate(0);
}

.td-checkbox-active {
  width: 10px;
  height: 6px;
  border-width: 0 0 2px 2px;
  border-style: solid;
  border-color: var(--btn-color);
  transform: rotate(-45deg) translate(1px, -1px);
}

.td-label input:focus + .td-checkbox-visible {
  .td-checkbox {
    border-radius: 4px;
    border: 1px solid var(--focus-color);
  }

  .td-theme-toggle-switch .td-switch-track {
    border-color: var(--focus-color);
  }
}

.td-checkbox-read-only {
  .td-checkbox {
    background-color: var(--bg-layer-color);
    border: 1px solid var(--bg-layer-color);
  }

  .td-theme-toggle-switch {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

// Animation for smooth switching
@media (prefers-reduced-motion: no-preference) {
  .td-theme-toggle-switch {
    .td-switch-thumb {
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    &.td-switch-dark .td-switch-thumb {
      animation: switchSlide 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  }
}

@keyframes switchSlide {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(26px) scale(1.1);
  }
  100% {
    transform: translateX(24px) scale(1);
  }
}

// Responsive
@media (max-width: 768px) {
  .td-theme-toggle-switch {
    width: 44px;
    height: 22px;

    .td-switch-thumb {
      width: 16px;
      height: 16px;
      top: 2px;
    }

    &.td-switch-dark .td-switch-thumb {
      transform: translateX(20px);
    }
  }
}
</style>
