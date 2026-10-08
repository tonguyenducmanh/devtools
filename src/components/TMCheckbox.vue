<template>
  <span
    class="tm-checkbox-container"
    :class="{
      'tm-checkbox-read-only': readOnly,
      'tm-checkbox-no-margin': noMargin,
    }"
  >
    <label
      class="tm-label no-select"
      :class="{ 'tm-label-checked': modelValue }"
    >
      <input
        type="checkbox"
        :checked="modelValue"
        @input="changeInputValue"
        :disabled="readOnly || variant == $tmEnum.checkboxType.switch"
        :name="inputId"
      />
      <span
        v-if="variant == $tmEnum.checkboxType.checkbox"
        class="flex tm-checkbox-visible"
      >
        <span class="tm-checkbox">
          <span v-if="modelValue" class="tm-checkbox-active"></span>
        </span>
        <span class="tm-label-content">{{ label.capitalize() }}</span>
      </span>
      <span
        v-else-if="variant == $tmEnum.checkboxType.switch"
        class="flex tm-checkbox-visible tm-switch-layout"
      >
        <span class="tm-label-content">{{ label.capitalize() }}</span>
        <button
          type="button"
          class="tm-theme-toggle-switch"
          :class="{ 'tm-switch-dark': modelValue }"
          @click.prevent="toggleSwitch"
        >
          <span class="tm-switch-track">
            <span class="tm-switch-thumb"></span>
          </span>
        </button>
      </span>
    </label>
  </span>
</template>

<script>
import tmEnum from "@/common/TMEnum.js";

export default {
  name: "TMCheckbox",
  created() {},
  mounted() {},
  methods: {},
  computed: {
    inputId() {
      return `tm-radio-group-${this.$.uid}`;
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
      default: tmEnum.checkboxType.checkbox,
    },
    width: {
      type: String,
      default: "100%",
    },
    noMargin: {
      type: Boolean,
      default: false,
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
.tm-checkbox-container {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--padding);
  box-sizing: border-box;
  width: 100%;

  .tm-label {
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

  .tm-checkbox {
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

  .tm-checkbox-visible {
    justify-content: space-between;
    width: 100%;
    align-items: center;

    &.tm-switch-layout {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--padding);
    }
  }

  .tm-label-content {
    white-space: nowrap;
  }

  // Switch styles - giống TMHeaderApp
  .tm-theme-toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    outline: none;
    flex-shrink: 0;

    .tm-switch-track {
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

    &:hover .tm-switch-track {
      border: 1px solid var(--focus-color);
    }

    .tm-switch-thumb {
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
    &.tm-switch-dark {
      .tm-switch-track {
        background-color: var(--btn-secondary-color);
      }

      .tm-switch-thumb {
        transform: translateX(24px);
        background-color: var(--checkbox-thumb-active-color);
        border-color: var(--btn-color);
      }
    }

    // Hover effects
    &:hover {
      .tm-switch-track {
        transform: scale(1.02);
      }

      .tm-switch-thumb {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
      }
    }

    &:active {
      .tm-switch-track {
        transform: scale(0.98);
      }
    }
  }
}

.tm-checkbox-no-margin {
  padding: unset;
  margin: unset;
}

.tm-label-checked .tm-checkbox {
  border: 1px solid var(--btn-color);
  transform: rotate(0);
}

.tm-checkbox-active {
  width: 10px;
  height: 6px;
  border-width: 0 0 2px 2px;
  border-style: solid;
  border-color: var(--btn-color);
  transform: rotate(-45deg) translate(1px, -1px);
}

.tm-label input:focus + .tm-checkbox-visible {
  .tm-checkbox {
    border-radius: 4px;
    border: 1px solid var(--focus-color);
  }

  .tm-theme-toggle-switch .tm-switch-track {
    border-color: var(--focus-color);
  }
}

.tm-checkbox-read-only {
  .tm-checkbox {
    background-color: var(--bg-layer-color);
    border: 1px solid var(--bg-layer-color);
  }

  .tm-theme-toggle-switch {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

// Animation for smooth switching
@media (prefers-reduced-motion: no-preference) {
  .tm-theme-toggle-switch {
    .tm-switch-thumb {
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    &.tm-switch-dark .tm-switch-thumb {
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
  .tm-theme-toggle-switch {
    width: 44px;
    height: 22px;

    .tm-switch-thumb {
      width: 16px;
      height: 16px;
      top: 2px;
    }

    &.tm-switch-dark .tm-switch-thumb {
      transform: translateX(20px);
    }
  }
}
</style>
