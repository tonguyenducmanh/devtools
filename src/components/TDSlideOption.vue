<template>
  <div
    class="td-slide-group"
    :class="{
      'layout-horizontal': layout === $tdEnum.coordinateAxes.horizontal,
      'td-slide-group-no-margin': noMargin,
    }"
  >
    <div class="td-slide-group-label" v-if="label">
      {{ label.capitalize() }}
    </div>
    <div v-if="options && options.length > 0" class="flex td-slide-group-area">
      <div
        class="td-slide-item"
        :class="{ 'td-slide-item-selected': option.value == modelValue }"
        v-for="(option, index) in options"
        :key="index"
        @click="changeSlideVal(option.value)"
      >
        <span>{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDslideGroup",
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
      default: tdEnum.coordinateAxes.horizontal, // Giá trị mặc định là hiển thị dọc
      validator: (value) =>
        [
          tdEnum.coordinateAxes.horizontal,
          tdEnum.coordinateAxes.vertical,
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
      return this.name || `td-slide-group-${this.$.uid}`;
    },
  },
  methods: {
    changeSlideVal(e) {
      let me = this;
      me.$emit("update:modelValue", e);
    },
  },
};
</script>

<style lang="scss" scoped>
.td-slide-group {
  margin: var(--padding);

  .td-slide-group-label {
    margin-bottom: var(--padding);
    font-size: var(--font-size-l-medium);
    color: var(--text-secondary-color);
  }
}

.td-slide-group-no-margin {
  margin: unset;
}

.td-slide-group.layout-horizontal {
  display: flex;
  flex-direction: row;
  align-items: end;
  .td-slide-group-label {
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
.td-slide-group-area {
  gap: var(--padding);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  .td-slide-item {
    cursor: pointer;
    padding: calc(var(--padding) / 2) var(--padding);
    border-radius: var(--border-radius);
  }
  .td-slide-item-selected {
    background-color: var(--focus-color);
    color: var(--bg-main-color);
  }
}
</style>
