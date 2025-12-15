<template>
  <button
    @click="handleClick"
    class="td-button noselect"
    :class="{
      'td-button-secondary': type == $tdEnum.buttonType.secondary,
      'td-button-readonly': readOnly,
      'td-button-no-margin': noMargin,
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
  created() {
    let me = this;
    me.debouncedFunc = me.$tdUtility.debounce((e) => {
      e.preventDefault();
      me.$emit("click", e);
    }, me.debounceTime);
  },
  mounted() {},
  emits: ["click"],
  beforeUnmount() {
    let me = this;
    me.debouncedFunc = null;
  },
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
    debounceTime: {
      type: Number,
      default: 200,
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      debouncedFunc: null,
    };
  },
  methods: {
    handleClick(e) {
      let me = this;
      e.preventDefault();
      me.debouncedFunc(e);
    },
  },
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
  border: 1px solid transparent;
}
.td-button-no-margin {
  margin: unset;
}
.td-button:hover {
  background-color: var(--focus-color);
}

.td-button:active {
  background-color: var(--focus-color);
}
.td-button:focus {
  border: 1px solid var(--focus-color);
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
  border: 1px solid var(--btn-secondary-focus-color);
}

.td-button-readonly {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
