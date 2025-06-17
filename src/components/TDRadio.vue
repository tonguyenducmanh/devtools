<template>
  <div class="td-radio" :class="{ 'td-radio-disabled': disabled }">
    <input
      type="radio"
      class="td-radio-input"
      :id="inputId"
      :value="value"
      :name="name"
      :checked="modelValue === value"
      @change="handleChange"
      :disabled="disabled"
    />
    <label class="td-radio-label" v-if="label" :for="inputId">{{
      label.capitalize()
    }}</label>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "TDRadio",
  props: {
    value: {
      type: [String, Number, Boolean, Object],
      required: true,
    },
    label: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    inputId() {
      return `td-radio-${this.$.uid}`;
    },
  },
  methods: {
    handleChange(event) {
      this.$emit("update:modelValue", this.value);
    },
  },
};
</script>

<style lang="scss" scoped>
.td-radio {
  display: inline-flex;
  align-items: center;
  margin-right: var(--padding-medium);
  white-space: nowrap;
  cursor: pointer;
  user-select: none; // Ngăn việc chọn text khi click

  .td-radio-input {
    appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid var(--border-color);
    border-radius: 50%;
    background-color: var(--bg-main-color);
    cursor: pointer;
    outline: none;
    position: relative;
    transition: border-color 0.2s ease;

    &:hover {
      border: 1.5px solid var(--btn-color);
    }

    &:checked {
      border: 1px solid var(--btn-color);
      background-color: var(--btn-color);

      &::before {
        content: "";
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--bg-main-color);
      }
    }
  }

  .td-radio-label {
    margin-left: var(--padding);
    font-size: var(--font-size-medium);
    color: var(--text-primary-color);
    cursor: pointer; // Thêm cursor pointer cho label
  }
}
.td-radio-disabled {
  opacity: 0.4; // Giảm độ sáng của radio khi disabled
}
</style>
