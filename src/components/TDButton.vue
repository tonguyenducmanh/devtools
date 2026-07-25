<template>
  <button
    @click="debounceHandleClick"
    class="td-button noselect"
    :class="{
      'td-button-secondary': type == $tdEnum.buttonType.secondary,
      'td-button-readonly': readOnly,
      'td-button-no-margin': noMargin,
      'td-button-icon': iconClass,
      'td-button-small': isSmallButton,
    }"
    :disabled="readOnly"
    :style="borderRadiusStyle"
  >
    <span v-if="iconClass" class="td-icon" :class="iconClass"></span>
    <span v-else>
      {{ label.capitalize() }}
    </span>
  </button>
</template>

<script>
import tdEnum from "@/common/TDEnum.js";
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";
import _ from "@/common/TDCommonFunction.js";

export default {
  name: "TDButton",
  mixins: [TDStylePremitiveMixin],
  created() {
    this.debounceHandleClick = _.debounce(this.handleClick, 300);
  },
  mounted() {},
  emits: ["click"],
  beforeUnmount() {
    if (this.debounceHandleClick?.cancel) {
      this.debounceHandleClick.cancel();
    }
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
    noMargin: {
      type: Boolean,
      default: false,
    },
    iconClass: {
      type: String,
      default: "",
    },
    isSmallButton: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {};
  },
  methods: {
    handleClick(e) {
      let me = this;
      e.preventDefault();
      me.$emit("click", e);
    },
  },
};
</script>
<style lang="scss" scoped>
.td-button {
  flex-shrink: 0;
  outline: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: var(--base-component-height);
  padding: var(--padding) var(--padding-x-medium);
  margin: var(--padding);
  background-color: var(--btn-color);
  color: var(--selected-item-text-color);
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  overflow-wrap: normal; /* Allows breaking long words */
  word-break: keep-all; /* For wider browser support */
  white-space: nowrap; /* Ensure wrapping is enabled */
  border: 1px solid transparent;
}
.td-button-small {
  height: 25px;
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
.td-button-icon {
  padding: 0 var(--padding);
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
  .td-icon {
    cursor: not-allowed;
  }
}

body[data-theme="light"] {
  .td-button-icon {
    .td-icon {
      filter: brightness(0) invert(1);
    }
  }
  .td-button-secondary {
    .td-icon {
      filter: brightness(0);
    }
  }
}
body[data-theme="dark"] {
  .td-button-secondary {
    background-color: var(--bg-thirt-color);
  }
  .td-button-secondary:hover {
    border: 1px solid var(--border-color);
    background-color: #303130;
  }
}
</style>
