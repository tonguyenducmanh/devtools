<template>
  <div class="td-input" :class="{ 'td-input-read-only': readOnly }">
    <input
      :id="inputId"
      type="checkbox"
      :checked="modelValue"
      @input="changeInputValue"
      :disabled="readOnly"
    />
    <label :for="inputId" class="td-label">{{ label }}</label>
  </div>
</template>

<script>
export default {
  name: "TDCheckbox",
  created() {},
  mounted() {},
  methods: {},
  computed: {
    inputId() {
      return this.$.uid;
    },
  },
  props: {
    modelValue: {
      type: Boolean,
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
    changeInputValue(e) {
      let me = this;
      me.$emit("update:modelValue", e.target.checked);
    },
  },
};
</script>
<style lang="scss" scoped>
.td-input {
  display: flex;
  width: 100%;
  align-items: center;
  margin: var(--padding);
  .td-label {
    cursor: pointer;
    overflow-wrap: normal; /* Allows breaking long words */
    word-break: keep-all; /* For wider browser support */
    white-space: nowrap; /* Ensure wrapping is enabled */
    padding-right: var(--padding);
    padding-left: var(--padding);
    color: var(--text-primary-color);
  }
}
.td-input-read-only input {
  background-color: var(--bg-sub-color);
}
</style>
