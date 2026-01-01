<template>
  <span
    class="td-checkbox-container"
    :class="{ 'td-checkbox-read-only': readOnly }"
  >
    <label
      class="td-label no-select"
      :class="{ 'td-label-checked': modelValue }"
    >
      <input
        type="checkbox"
        :checked="modelValue"
        @input="changeInputValue"
        :disabled="readOnly"
        :name="inputId"
      />
      <span v-if="variant == $tdEnum.checkboxType.checkbox" class="flex td-checkbox-visible">
        <span class="td-checkbox">
          <span v-if="modelValue" class="td-checkbox-active"></span>
        </span>
        <span class="td-label-content">{{ label.capitalize() }}</span>
      </span>
      <span v-else-if="variant == $tdEnum.checkboxType.switch" class="flex td-checkbox-visible">
        <span class="td-label-content">{{ label.capitalize() }}</span>
        <span class="td-checkbox">
          <span v-if="modelValue" class="td-checkbox-active"></span>
        </span>
      </span>
    </label>
  </span>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDCheckbox",
  created() {},
  mounted() {},
  methods: {},
  computed: {
    inputId() {
      return `td-radio-group-${this.$.uid}`;
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
    variant: {
      type: Number,
      default: tdEnum.checkboxType.checkbox,
    },
    width: {
      type: String,
      default: "100%",
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
      me.$emit("change", e.target.checked);
    },
  },
};
</script>
<style lang="scss" scoped>
.td-checkbox-container {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--padding);
  box-sizing: border-box;
  width: 100%;
  .td-label {
    width: 100%;
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
  .td-checkbox-visible {
    justify-content: space-between;
    width: 100%;
  }
  .td-label-content {
    white-space: nowrap;
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
  border: 1px solid var(--focus-color);
}
.td-checkbox-read-only .td-checkbox {
  background-color: var(--bg-layer-color);
  border: 1px solid var(--bg-layer-color);
}
</style>
