<template>
  <button @click="debounceHandleClick" class="tm-button noselect" :class="{
    'tm-button-secondary': type == $tmEnum.buttonType.secondary,
    'tm-button-readonly': readOnly,
    'tm-button-no-margin': noMargin,
    'tm-button-icon': iconClass,
    'tm-button-small': isSmallButton,
  }" :disabled="readOnly" :style="borderRadiusStyle">
    <span v-if="iconClass" class="tm-icon" :class="iconClass"></span>
    <span v-else>
      {{ label.capitalize() }}
    </span>
  </button>
</template>

<script>
import tmEnum from "@/common/TMEnum.js";
import TMStylePremitiveMixin from "@/mixins/TMStylePremitiveMixin.js";
import _ from "@/common/TMCommonFunction.js";

export default {
  name: "TMButton",
  mixins: [TMStylePremitiveMixin],
  created() {
    this.debounceHandleClick = _.debounce(this.handleClick, 300);
  },
  mounted() { },
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
      default: tmEnum.buttonType.primary,
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
.tm-button {
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
  background-color: var(--btn-primary-bg);
  color: var(--selected-item-text-color);
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  overflow-wrap: normal;
  /* Allows breaking long words */
  word-break: keep-all;
  /* For wider browser support */
  white-space: nowrap;
  /* Ensure wrapping is enabled */
  border: 1px solid var(--border-color);
  box-sizing: border-box;

}

.tm-button-small {
  height: 25px;
}

.tm-button-no-margin {
  margin: unset;
}

.tm-button:hover {
  background-color: var(--focus-color);
  border: 1px solid transparent;
}

.tm-button:active {
  background-color: var(--focus-color);
}

.tm-button:focus {
  border: 1px solid var(--focus-color);
}

.tm-button-icon {
  padding: 0 var(--padding);
}

.tm-button-secondary {
  background-color: var(--btn-secondary-bg);
  color: var(--btn-secondary-text-color);
}

.tm-button-secondary:hover {
  background-color: var(--btn-secondary-hover-bg);
  border: 1px solid var(--focus-color);
}

.tm-button-secondary:active {
  background-color: var(--btn-secondary-focus-color);
}

.tm-button-secondary:focus {
  border: 1px solid var(--btn-secondary-focus-color);
}

.tm-button-readonly {
  opacity: 0.5;
  cursor: not-allowed;

  .tm-icon {
    cursor: not-allowed;
  }
}
</style>
