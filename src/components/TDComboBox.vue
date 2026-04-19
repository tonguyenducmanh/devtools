<template>
  <div
    class="flex no-select td-combobox"
    :class="{ 'flex-col': isLabelTop, 'td-combobox-no-margin': noMargin }"
    v-click-outside="closeCombo"
  >
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ isCapitalizeText ? label.capitalize() : label }}
    </div>

    <div class="td-combobox-wraper">
      <div
        class="td-combobox-control"
        :class="{ readOnly }"
        :style="styleCombo"
        @click="toggle"
      >
        <span class="td-combobox-value">
          {{ selectedLabel }}
        </span>
        <TDArrow :openProp="open" />
      </div>
      <div
        v-if="open"
        ref="dropdown"
        class="td-combobox-dropdown"
        :class="{ 'td-combobox-droptop': isDropTop }"
      >
        <TDComboBoxOption
          v-for="(option, index) in options"
          :key="index"
          :option="option"
          :selected="option.value === modelValue"
          @select="select"
          class="td-dropdown-item"
        >
          <slot name="option" :option="option">
            {{ isCapitalizeText ? option.label.capitalize() : option.label }}
          </slot>
        </TDComboBoxOption>
      </div>
    </div>
  </div>
</template>

<script>
import TDComboBoxOption from "./TDComboBoxOption.vue";
import TDArrow from "./TDArrow.vue";
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";
export default {
  name: "TDComboBox",
  components: { TDComboBoxOption, TDArrow },
  mixins: [TDStylePremitiveMixin],

  props: {
    label: {
      type: String,
      default: null,
    },
    modelValue: {
      type: [String, Number, Boolean, Object],
      default: null,
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      required: true,
      validator: (options) => options.every((o) => o.hasOwnProperty("value")),
    },
    isLabelTop: {
      type: Boolean,
      default: false,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    width: {
      type: Number,
      default: 100,
    },
    customStyle: {
      type: Object,
      default: null,
    },
    placeHolder: {
      type: String,
      default: "Chọn giá trị",
    },
    usingStylePercent: {
      type: Boolean,
      default: false,
    },
    isCapitalizeText: {
      type: Boolean,
      default: true,
    },
    isDropTop: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "selected"],
  data() {
    return {
      open: false,
    };
  },
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const dropdown = this.$refs.dropdown;
          if (!dropdown) return;
          const selectedEl = dropdown.querySelector(
            ".td-combobox-option.selected",
          );
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: "start", inline: "nearest" });
          }
        });
      }
    },
  },
  computed: {
    selectedLabel() {
      const found = this.options.find((o) => o.value === this.modelValue);
      return found
        ? this.isCapitalizeText
          ? found.label.capitalize()
          : found.label
        : this.placeHolder;
    },
    styleCombo() {
      let me = this;
      let styleDynamicCombo = null;
      if (me.width) {
        let currentSettingBorder = me.borderRadiusStyle;
        let keySize = me.usingStylePercent ? "%" : "px";
        styleDynamicCombo = {
          width: `${me.width}${keySize}`,
          "max-width": `${me.width}${keySize}`,
          "min-width": `${me.width}${keySize}`,
        };
        Object.assign(styleDynamicCombo, currentSettingBorder);
      }
      if (me.customStyle) {
        Object.assign(styleDynamicCombo, me.customStyle);
      }
      return styleDynamicCombo;
    },
  },
  methods: {
    toggle() {
      if (this.readOnly) return;
      this.open = !this.open;
    },
    select(value) {
      this.$emit("update:modelValue", value);
      this.$emit("selected", value);
      this.open = false;
    },
    closeCombo() {
      this.open = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.td-combobox {
  position: relative;
  margin: var(--padding);
  .td-label {
    overflow-wrap: normal; /* Allows breaking long words */
    word-break: keep-all; /* For wider browser support */
    white-space: nowrap; /* Ensure wrapping is enabled */
    padding-right: var(--padding);
    font-size: var(--font-size-l-medium);
  }
  .td-label-top {
    padding-bottom: var(--padding);
  }
  .td-combobox-wraper {
    width: 100%;
    position: relative;
    .td-combobox-control {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--padding);
      border: 1px solid var(--border-color);
      cursor: pointer;
      background: var(--bg-thirt-color);

      &:hover {
        border-color: var(--btn-color);
      }

      &.readOnly {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .td-combobox-value {
        flex: 1; /* Chiếm hết không gian còn lại */
        overflow: hidden; /* Ẩn phần thừa */
        text-overflow: ellipsis; /* Hiện dấu ... */
        white-space: nowrap; /* Không cho xuống dòng */
      }
    }
    .td-combobox-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 10;
      width: 100%;
      min-width: 100%; /* Ít nhất phải bằng chiều rộng ô input */
      width: max-content; /* Tự mở rộng theo nội dung dài nhất */
      max-width: 300px; /* (Tùy chọn) Giới hạn tối đa để không tràn màn hình */
      max-height: 300px;
      overflow-y: auto;
      margin-top: 4px;
      border: 1px solid var(--border-color);
      background: var(--bg-main-color);
      border-radius: var(--border-radius-component);
      .td-dropdown-item:first-child {
        border-radius: var(--border-radius-component)
          var(--border-radius-component) 0 0;
      }
      .td-dropdown-item:last-child {
        border-radius: 0 0 var(--border-radius-component)
          var(--border-radius-component);
      }
    }
    .td-combobox-droptop {
      top: unset;
      bottom: 100%;
      margin-top: unset;
      margin-bottom: 4px;
    }

    .arrow {
      width: 12px;
      height: 8px;
      color: var(--border-color);
    }
    .td-combobox-arrow-open {
      transform: rotate(180deg);
      color: var(--border-color);
      transition: transform 0.2s ease;
    }
  }
}
.td-combobox-no-margin {
  margin: unset;
}
</style>
