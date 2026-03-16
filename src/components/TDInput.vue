<template>
  <div
    class="td-input"
    :class="{
      'flex-col': isLabelTop,
      'td-input-read-only': readOnly,
      'td-input-no-margin': noMargin,
    }"
  >
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ label.capitalize() }}
    </div>
    <input
      :placeholder="placeHolder || $t('i18nCommon.typeInput')"
      :value="modelValue"
      @input="changeInputValue"
      @focus="handleFocus"
      @blur="handleBlur"
      :disabled="readOnly"
      spellcheck="false"
      :type="inputType"
      :name="inputId"
      :ref="inputId"
      :style="borderRadiusStyle"
      autocomplete="off"
      v-click-outside="handleInputClickOutSide"
    />
    <slot></slot>
  </div>
</template>

<script>
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";
import TDShortcutAction from "@/common/TDShortcutAction.js";

export default {
  name: "TDInput",
  mixins: [TDStylePremitiveMixin],

  mounted() {
    this.registerShortcut();
  },
  beforeUnmount() {
    this.unregisterShortcut();
  },
  computed: {
    inputId() {
      return `td-input-${this.$.uid}`;
    },
  },
  props: {
    placeHolder: {
      type: [String, Number],
      default: null,
    },
    modelValue: {
      type: [String, Number],
      default: null,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    isLabelTop: {
      type: Boolean,
      default: false,
    },
    inputType: {
      type: String,
      default: "text",
      validator: (prop) => ["text", "password", "number"].includes(prop),
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
    registerShortcut() {
      TDShortcutAction.register("uuid", {
        key: "u",
        labelKey: "i18nCommon.footer.uuid",
        tooltipKey: "i18nCommon.footer.uuidTooltip",
        action: this.handleUUIDShortcut,
      });
    },
    unregisterShortcut() {
      TDShortcutAction.unregister("uuid");
    },
    handleUUIDShortcut() {
      const uuid = this.$tdUtility.newGuid();
      const input = this.$refs[this.inputId];
      if (input) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        input.value = value.substring(0, start) + uuid + value.substring(end);
        input.selectionStart = input.selectionEnd = start + uuid.length;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    },
    handleFocus() {
      this.registerShortcut();
    },
    handleBlur() {
      this.unregisterShortcut();
    },
    changeInputValue(e) {
      let me = this;
      let valueEmit = e.target.value;
      // e.target.value luôn trả về giá trị là kiểu text
      if (me.inputType == "number") {
        valueEmit = valueEmit === "" ? 0 : Number(valueEmit);
      }
      me.$emit("update:modelValue", valueEmit);
    },
    handleInputClickOutSide() {
      let me = this;
      me.$emit("clickOutSide");
    },
    focus() {
      let me = this;
      me.$refs[me.inputId].focus();
    },
  },
};
</script>
<style lang="scss" scoped>
.td-input {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  margin: var(--padding);
  .td-label {
    overflow-wrap: normal; /* Allows breaking long words */
    word-break: keep-all; /* For wider browser support */
    white-space: nowrap; /* Ensure wrapping is enabled */
    padding-right: var(--padding);
  }
  .td-label-top {
    padding-bottom: var(--padding);
  }
  input {
    border: 1px solid var(--border-color);
    width: 100%;
    padding: var(--padding);
    background-color: var(--bg-thirt-color);
    color: var(--text-primary-color);
    font-size: var(--font-size-medium);
  }
  input::placeholder {
    color: var(--text-secondary-color);
  }
  input:focus {
    outline: none;
    border: 1px solid var(--focus-color);
  }
}
.td-input-read-only input {
  border: 1px solid transparent;
  background-color: var(--bg-layer-color);
}
.td-input-no-margin {
  margin: unset;
}

/* Chrome, Edge, Safari */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
