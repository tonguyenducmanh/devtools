<template>
  <div
    class="td-combobox-option"
    :class="{ selected, disabled: option.disabled }"
    @click="handleSelect"
    :style="option.customStyle"
  >
    <slot>{{ option.label.capitalize() }}</slot>
  </div>
</template>

<script>
export default {
  name: "TDComboBoxOption",
  props: {
    option: {
      type: Object,
      required: true,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleSelect() {
      if (this.option.disabled) return;
      this.$emit("select", this.option.value);
    },
  },
};
</script>

<style lang="scss" scoped>
.td-combobox-option {
  padding: var(--padding);
  cursor: pointer;

  &:hover {
    background: var(--bg-layer-color);
  }

  &.selected {
    background: var(--bg-layer-color);
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
