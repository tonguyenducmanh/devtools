<template>
  <div
    class="tm-input"
    :class="{
      'flex-col': isLabelTop,
      'tm-input-read-only': readOnly,
      'tm-input-no-margin': noMargin,
    }"
  >
    <div class="tm-label" :class="{ 'tm-label-top': isLabelTop }" v-if="label">
      {{ label.capitalize() }}
    </div>
    <input
      :placeholder="placeHolder || $t('i18nCommon.typeInput')"
      :value="modelValue"
      @input="changeInputValue"
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
import TMStylePremitiveMixin from "@/mixins/TMStylePremitiveMixin.js";

export default {
  name: "TMInput",
  mixins: [TMStylePremitiveMixin],

  created() {},
  mounted() {},
  methods: {},
  computed: {
    inputId() {
      return `tm-input-${this.$.uid}`;
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
.tm-input {
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  margin: var(--padding);
  .tm-label {
    overflow-wrap: normal; /* Allows breaking long words */
    word-break: keep-all; /* For wider browser support */
    white-space: nowrap; /* Ensure wrapping is enabled */
    padding-right: var(--padding);
  }
  .tm-label-top {
    padding-bottom: var(--padding);
  }
  input {
    border: 1px solid var(--border-color);
    width: 100%;
    height: var(--base-component-height);
    padding: 0 var(--padding);
    background-color: var(--bg-thirt-color);
    color: var(--text-primary-color);
    font-size: var(--font-size-medium);
  }
  input::placeholder {
    color: var(--text-secondary-color);
    opacity: var(--placeholder-opacity);
  }
  input:hover {
    border: 1px solid var(--focus-color);
  }
  input:focus {
    outline: none;
    border: 1px solid var(--focus-color);
  }
}
.tm-input-read-only input {
  border: 1px solid transparent;
  background-color: var(--bg-layer-color);
}
.tm-input-no-margin {
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
