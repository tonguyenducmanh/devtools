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
        ref="control"
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
    </div>

    <!--
      Danh sách option nằm ở body (TDFlyoutPanel dùng Teleport) chứ không nằm
      trong ô control, nhờ vậy không bị cắt bởi overflow hay bị chìm dưới
      1 component cha (panel monaco, form data, sidebar, popup...)
    -->
    <TDFlyoutPanel
      :show="open"
      :anchorElFlyout="controlEl"
      :placement="isDropTop ? 'top' : 'auto'"
      :minWidth="controlWidth"
      panelClass="td-combobox-flyout"
    >
      <div ref="dropdown" class="td-combobox-dropdown">
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
    </TDFlyoutPanel>
  </div>
</template>

<script>
import TDComboBoxOption from "./TDComboBoxOption.vue";
import TDArrow from "./TDArrow.vue";
import TDFlyoutPanel from "./TDFlyoutPanel.vue";
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";
export default {
  name: "TDComboBox",
  components: { TDComboBoxOption, TDArrow, TDFlyoutPanel },
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
      // ưu tiên mở lên trên ô control, panel vẫn tự đảo hướng nếu không đủ chỗ
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "selected"],
  data() {
    return {
      open: false,
      // ô control, dùng làm điểm neo cho flyout panel định vị danh sách option
      controlEl: null,
      // bề rộng ô control, danh sách option không được hẹp hơn giá trị này
      controlWidth: 0,
    };
  },
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(this.scrollSelectedToVisible);
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
      if (!this.open) {
        // Đo ô control trước khi mở để panel có sẵn điểm neo và bề rộng tối
        // thiểu ngay ở lần hiển thị đầu tiên, không phải đợi render lần hai
        this.syncControlInfo();
      }
      this.open = !this.open;
    },
    select(value) {
      this.$emit("update:modelValue", value);
      this.$emit("selected", value);
      this.open = false;
    },
    closeCombo(event) {
      // Danh sách option đã bị Teleport ra body nên không còn nằm trong
      // .td-combobox, vì vậy phải tự loại nó ra. Click trong danh sách thì để
      // select() tự đóng, giữ đúng hành vi cũ (bấm option disabled không đóng)
      if (event?.target?.closest?.(".td-combobox-dropdown")) return;
      this.open = false;
    },
    /**
     * Đo lại ô control ngay trước khi mở, vì độ rộng của nó có thể vừa thay
     * đổi (vd: combo box dùng width theo % trong 1 hàng co giãn)
     */
    syncControlInfo() {
      const control = this.$refs.control;
      if (!control) return;
      this.controlEl = control;
      this.controlWidth = control.getBoundingClientRect().width;
    },
    /**
     * Cuộn option đang chọn vào vùng nhìn thấy của danh sách.
     * Tự set scrollTop thay vì scrollIntoView vì scrollIntoView cuộn cả
     * các vùng scroll cha, dễ làm cả cửa sổ app bị nhảy theo
     */
    scrollSelectedToVisible() {
      const dropdown = this.$refs.dropdown;
      if (!dropdown) return;
      const selectedEl = dropdown.querySelector(".td-combobox-option.selected");
      if (!selectedEl) return;
      dropdown.scrollTop = Math.max(
        0,
        selectedEl.offsetTop - dropdown.clientHeight + selectedEl.offsetHeight,
      );
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
      height: var(--base-component-height);
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--padding);
      border: 1px solid var(--border-color);
      cursor: pointer;
      background: var(--bg-thirt-color);

      &:hover {
        border-color: var(--focus-color);
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

/* Danh sách option được Teleport ra body nên không còn nằm trong .td-combobox,
   vì vậy style của nó phải để cùng cấp, không nest bên trong .td-combobox.
   Viền/background của danh sách do .td-combobox-flyout trong flyout.scss lo. */
.td-combobox-dropdown {
  /* 100% giờ tính theo bề rộng của .td-combobox-flyout (panel được đặt
     min-width = bề rộng ô control), nên danh sách luôn rộng bằng ô control
     dù nội dung option có ngắn hơn */
  min-width: 100%;
  width: max-content; /* Tự mở rộng theo nội dung dài nhất */
  max-width: 300px; /* Giới hạn tối đa để không tràn màn hình */
  max-height: 300px;
  overflow-y: auto;
  .td-dropdown-item:first-child {
    border-radius: var(--border-radius-component) var(--border-radius-component)
      0 0;
  }
  .td-dropdown-item:last-child {
    border-radius: 0 0 var(--border-radius-component)
      var(--border-radius-component);
  }
}
</style>
