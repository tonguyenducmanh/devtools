<template>
  <div class="td-input" :class="{ 'flex-col': isLabelTop }">
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ label }}
    </div>
    <input
      :placeholder="placeHolder"
      :value="modelValue"
      @input="changeInputValue"
      :disabled="readOnly"
    />
    <slot></slot>
  </div>
</template>

<script>
import _ from "@/common/TDUtility.js";

export default {
  name: "TDInput",
  created() {},
  mounted() {},
  methods: {},
  props: {
    placeHolder: {
      type: String,
      default: "Nhập giá trị",
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
  }
  .td-label-top {
    padding-bottom: var(--padding);
  }
  input {
    border: 2px solid var(--border-color);
    width: 100%;
    padding: var(--padding);
    border-radius: var(--border-radius);
    background-color: var(--bg-sub-color);
    color: var(--text-primary-color);
  }

  input:focus {
    outline: none;
    border: 2px solid var(--focus-color);
  }
}
</style>
