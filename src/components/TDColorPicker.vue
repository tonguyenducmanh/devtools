<template>
  <div
    class="td-color-picker"
    :class="{
      'flex-col': isLabelTop,
      'td-color-picker-no-margin': noMargin,
      'td-color-picker-read-only': readOnly,
    }"
    :style="borderRadiusStyle"
  >
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ label.capitalize() }}
    </div>

    <div class="td-color-input-group">
      <div class="td-color-swatch-wrapper">
        <div
          class="td-color-swatch"
          :style="{ backgroundColor: modelValue || '#ffffff' }"
          @click="triggerNativePicker"
        ></div>
        <input
          ref="nativeColorInput"
          type="color"
          class="td-native-hidden"
          :value="modelValue"
          @input="onColorChange"
        />
      </div>

      <input
        type="text"
        class="td-hex-input-field"
        :value="modelValue"
        @input="onHexInput"
        :placeholder="placeholder || '#FFFFFF'"
        :disabled="readOnly"
        spellcheck="false"
      />
    </div>
  </div>
</template>

<script>
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";

export default {
  name: "TDColorPicker",
  mixins: [TDStylePremitiveMixin],
  props: {
    modelValue: {
      type: String,
      default: "#ffffff",
    },
    label: {
      type: String,
      default: "",
    },
    isLabelTop: {
      type: Boolean,
      default: false,
    },
    noMargin: {
      type: Boolean,
      default: false,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "#FFFFFF",
    },
  },
  methods: {
    /**
     * Kích hoạt bảng chọn màu của hệ điều hành khi click vào ô màu
     */
    triggerNativePicker() {
      if (this.readOnly) return;
      this.$refs.nativeColorInput.click();
    },

    /**
     * Xử lý khi chọn màu từ bảng kéo thả
     */
    onColorChange(event) {
      const newColor = event.target.value.toUpperCase();
      this.$emit("update:modelValue", newColor);
    },

    /**
     * Xử lý khi người dùng gõ trực tiếp vào ô input
     */
    onHexInput(event) {
      let val = event.target.value;
      if (val && !val.startsWith("#")) val = "#" + val;

      // Emit giá trị thô để UI cập nhật liên tục
      this.$emit("update:modelValue", val);

      // (Tùy chọn) Chỉ emit khi mã Hex hợp lệ để tránh lỗi dữ liệu phía sau
      // const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      // if (hexRegex.test(val)) {
      //   this.$emit("update:modelValue", val.toUpperCase());
      // }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-color-picker {
  display: flex;
  align-items: center;
  margin: var(--padding);
  padding: var(--padding);
  background-color: var(--bg-thirt-color);
  border: 1px solid var(--border-color);

  &:focus-within {
    border-color: var(--focus-color);
  }
  &.flex-col {
    flex-direction: column;
    align-items: flex-start;
  }

  .td-label {
    padding-right: var(--padding);
    &.td-label-top {
      padding-bottom: var(--padding);
    }
  }
}

.td-color-input-group {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: border-color 0.2s;
}

.td-color-swatch-wrapper {
  display: flex;
  align-items: center;
  position: relative;

  .td-color-swatch {
    width: 20px;
    height: 20px;
    cursor: pointer;
    border: 1px solid var(--border-color);
    &:hover {
      filter: brightness(0.9);
    }
  }

  .td-native-hidden {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
}

.td-hex-input-field {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0 10px;
  height: 100%;
  color: var(--text-primary-color);
  font-size: var(--font-size-medium);
  font-family: monospace;
  outline: none;

  &::placeholder {
    color: var(--text-secondary-color);
    opacity: var(--placeholder-opacity);
  }
}

.td-color-picker-read-only {
  opacity: 0.7;
  .td-color-swatch {
    cursor: not-allowed;
  }
  .td-color-input-group {
    background-color: var(--bg-layer-color);
  }
}

.td-color-picker-no-margin {
  margin: unset;
}
</style>
