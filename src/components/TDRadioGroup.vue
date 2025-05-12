<template>
  <div
    class="td-radio-group"
    :class="{ 'layout-horizontal': layout === 'horizontal' }"
  >
    <div class="td-label" v-if="label">{{ label.capitalize() }}</div>
    <div v-for="(option, index) in options" :key="index">
      <TDRadio
        :value="option.value"
        :label="option.label"
        :name="generatedName"
        :disabled="option.disabled"
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)"
      >
        <slot :option="option"></slot>
      </TDRadio>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDRadioGroup",
  props: {
    label: {
      type: String,
      default: null,
    },
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: null,
    },
    name: {
      type: String,
      default: null, // Không còn là required
    },
    options: {
      type: Array,
      default: () => [],
      required: true,
      validator: (options) =>
        options.every((option) => option.hasOwnProperty("value")),
    },
    layout: {
      type: String,
      default: "vertical", // Giá trị mặc định là hiển thị dọc
      validator: (value) => ["vertical", "horizontal"].includes(value),
    },
  },
  emits: ["update:modelValue"],
  computed: {
    generatedName() {
      return this.name || `td-radio-group-${this.$.uid}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.td-radio-group {
  margin: var(--padding);

  .td-label {
    margin-bottom: var(--padding-small);
    font-size: var(--font-size-large);
    color: var(--text-secondary-color);
  }
}

.td-radio-group.layout-horizontal {
  display: flex;
  flex-direction: row;
  align-items: end;
  .td-label {
    margin-bottom: 0;
    margin-right: var(--padding);
  }
  > div {
    margin-right: var(--padding-medium);

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
