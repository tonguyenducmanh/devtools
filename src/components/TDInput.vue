<template>
  <div class="td-input">
    <div v-if="label">{{ label }}</div>
    <input
      :placeholder="placeHolder"
      :value="modelValue"
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
  },
  data() {
    return {
      value: null,
    };
  },
  watch: {},
  methods: {
    changeInputValue: _.debounce(function (e) {
      let me = this;
      me.$emit("update:modelValue", e.target.value);
    }, 500),
  },
};
</script>
<style lang="scss" scoped>
.td-input {
  display: flex;
  height: 100%;
  width: 100%;

  input {
    border: 2px solid var(--border-color);
    width: 100%;
    padding: var(--padding);
    border-radius: var(--border-radius);
  }

  input:focus {
    outline: none;
    border: 2px solid var(--focus-color);
  }
}
</style>
