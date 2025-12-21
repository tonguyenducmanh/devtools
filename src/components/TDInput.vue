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
      :disabled="readOnly"
      spellcheck="false"
      :type="inputType"
      :name="inputId"
      :style="borderRadiusStyle"
      autocomplete="off"
    />
    <slot></slot>
  </div>
</template>

<script>
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";

export default {
  name: "TDInput",
  mixins: [TDStylePremitiveMixin],

  created() {},
  mounted() {},
  methods: {},
  computed: {
    inputId() {
      return `td-input-${this.$.uid}`;
    },
  },
  props: {
    placeHolder: {
      type: String,
      default: null,
    },
    modelValue: {
      type: String,
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
      me.$emit("update:modelValue", e.target.value);
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
    font-size: var(--font-size-l-medium);
  }
  .td-label-top {
    padding-bottom: var(--padding);
  }
  input {
    border: 1px solid var(--border-color);
    width: 100%;
    padding: var(--padding);
    background-color: var(--bg-main-color);
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
</style>
