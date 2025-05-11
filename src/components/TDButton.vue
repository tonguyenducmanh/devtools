<template>
  <button
    class="td-button noselect"
    :class="{
      'td-button-secondary': type == $tdEnum.buttonType.secondary,
      'td-button-readonly': readOnly,
    }"
    :disabled="readOnly"
  >
    {{ label.capitalize() }}
  </button>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";

export default {
  name: "TDButton",
  created() {},
  mounted() {},
  methods: {},
  props: {
    readOnly: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "Button",
    },
    type: {
      type: String,
      default: tdEnum.buttonType.primary,
    },
  },
  data() {
    return {};
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
.td-button {
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: 30px;
  padding: var(--padding-x-medium) var(--padding-large);
  margin: var(--padding);
  background-color: var(--btn-color);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  overflow-wrap: normal; /* Allows breaking long words */
  word-break: keep-all; /* For wider browser support */
  white-space: nowrap; /* Ensure wrapping is enabled */
}

.td-button:hover {
  background-color: var(--focus-color);
  transform: scale(1.01);
}

.td-button:active {
  background-color: var(--focus-color);
  transform: scale(0.98);
}
.td-button:focus {
  border: 2px solid var(--focus-color);
  box-sizing: border-box;
}

.td-button-secondary {
  background-color: var(--btn-secondary-color);
  color: var(--btn-secondary-text-color);
}
.td-button-secondary:hover {
  background-color: var(--btn-secondary-focus-color);
}

.td-button-secondary:active {
  background-color: var(--btn-secondary-focus-color);
}
.td-button-secondary:focus {
  border: 2px solid var(--btn-secondary-focus-color);
}

.td-button-readonly {
  opacity: 0.5;
  cursor: unset;
}
</style>
