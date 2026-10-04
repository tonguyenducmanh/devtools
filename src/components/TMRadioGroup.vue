<template>
  <div
    class="tm-radio-group"
    :class="{
      'layout-horizontal': layout === $tmEnum.coordinateAxes.horizontal,
      'tm-radio-group-no-margin': noMargin,
    }"
  >
    <div class="tm-radio-group-label" v-if="label">
      {{ label.capitalize() }}
    </div>
    <div v-for="(option, index) in options" :key="index">
      <TMRadio
        :value="option.value"
        :label="option.label"
        :name="generatedName"
        :disabled="option.disabled"
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)"
      >
        <slot :option="option"></slot>
      </TMRadio>
    </div>
  </div>
</template>

<script>
import tmEnum from "@/common/TMEnum.js";

export default {
  name: "TMRadioGroup",
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
      default: tmEnum.coordinateAxes.horizontal, // Giá trị mặc định là hiển thị dọc
      validator: (value) =>
        [
          tmEnum.coordinateAxes.horizontal,
          tmEnum.coordinateAxes.vertical,
        ].includes(value),
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  computed: {
    generatedName() {
      return this.name || `tm-radio-group-${this.$.uid}`;
    },
  },
};
</script>

<style lang="scss" scoped>
.tm-radio-group {
  margin: var(--padding);

  .tm-radio-group-label {
    margin-bottom: var(--padding);
    font-size: var(--font-size-l-medium);
    color: var(--text-secondary-color);
  }
}

.tm-radio-group-no-margin {
  margin: unset;
}

.tm-radio-group.layout-horizontal {
  display: flex;
  flex-direction: row;
  align-items: end;
  .tm-radio-group-label {
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
