<template>
  <span
    class="td-checkbox-container"
    :class="{ 'td-checkbox-read-only': readOnly }"
  >
    <label class="td-label" :class="{ 'td-label-checked': modelValue }">
      <input
        type="checkbox"
        :checked="modelValue"
        @input="changeInputValue"
        :disabled="readOnly"
      />
      <span class="td-checkbox">
        <span v-if="modelValue" class="td-checkbox-active"></span>
      </span>
      <span class="td-label-content">{{ label.capitalize() }}</span>
    </label>
  </span>
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
.td-checkbox-container {
  position: relative;
  display: flex;
  align-items: center;
  margin: var(--padding);
  .td-label {
    justify-content: flex-start;
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
  }
  input {
    opacity: 0;
    width: 0%;
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
  .td-label-content {
    white-space: nowrap;
    padding-left: var(--padding);
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
.td-label input:focus + .td-checkbox {
  border-radius: 4px;
  border: 2px solid var(--focus-color);
}
.td-checkbox-read-only input {
  background-color: var(--bg-sub-color);
}
</style>
