<template>
  <div
    class="tm-color-picker"
    :class="{
      'flex-col': isLabelTop,
      'tm-color-picker-no-margin': noMargin,
      'tm-color-picker-read-only': readOnly,
    }"
    :style="borderRadiusStyle"
  >
    <div class="tm-label" :class="{ 'tm-label-top': isLabelTop }" v-if="label">
      {{ label.capitalize() }}
    </div>

    <div class="tm-color-input-group">
      <div class="tm-color-swatch-wrapper">
        <div
          class="tm-color-swatch"
          :style="{ backgroundColor: modelValue || '#ffffff' }"
          @click="triggerNativePicker"
        ></div>
        <input
          ref="nativeColorInput"
          type="color"
          class="tm-native-hidden"
          :value="modelValue"
          @input="onColorChange"
        />
      </div>

      <input
        type="text"
        class="tm-hex-input-field"
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
import TMStylePremitiveMixin from "@/mixins/TMStylePremitiveMixin.js";

export default {
  name: "TMColorPicker",
  mixins: [TMStylePremitiveMixin],
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
.tm-color-picker {
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

  .tm-label {
    padding-right: var(--padding);
    &.tm-label-top {
      padding-bottom: var(--padding);
    }
  }
}

.tm-color-input-group {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: border-color 0.2s;
}

.tm-color-swatch-wrapper {
  display: flex;
  align-items: center;
  position: relative;

  .tm-color-swatch {
    width: 20px;
    height: 20px;
    cursor: pointer;
    border: 1px solid var(--border-color);
    &:hover {
      filter: brightness(0.9);
    }
  }

  .tm-native-hidden {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }
}

.tm-hex-input-field {
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

.tm-color-picker-read-only {
  opacity: 0.7;
  .tm-color-swatch {
    cursor: not-allowed;
  }
  .tm-color-input-group {
    background-color: var(--bg-layer-color);
  }
}

.tm-color-picker-no-margin {
  margin: unset;
}
</style>
