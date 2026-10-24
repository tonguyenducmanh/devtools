<template>
  <div class="tm-full-tab-wrapper" :class="{ 'tm-full-tab-wrapper-active': modelValue }" :style="wrapperStyle">
    <div class="fullscreen-toolbar" :class="{ 'toolbar-pinned': isToolbarPinned }"
      v-if="modelValue || alwaysShowToolbar">
      <template v-if="!hidePin">
        <template v-if="isToolbarPinned">
          <div v-tooltip="unpinTooltip || $t('i18nCommon.remoteDesktop.unpin')" class="flex toolbar-btn"
            @click="unpinToolbar">
            <span class="tm-icon tm-unpin-icon"></span>
          </div>
        </template>
        <template v-else>
          <div v-tooltip="pinTooltip || $t('i18nCommon.remoteDesktop.pin')" class="flex toolbar-btn"
            @click="pinToolbar">
            <span class="tm-icon tm-pin-icon"></span>
          </div>
        </template>
      </template>

      <div class="flex tm-toolbar-utility-area">
        <slot name="toolbar-left"></slot>
        <template v-if="modelValue">
          <div v-tooltip="exitFullScreenTooltip || $t('i18nCommon.remoteDesktop.closeFullTab')" class="flex toolbar-btn"
            @click="toggleFullScreen">
            <span class="tm-icon tm-exit-full-screen-icon"></span>
          </div>
        </template>
        <template v-else>
          <div v-tooltip="fullScreenTooltip || $t('i18nCommon.remoteDesktop.fullTab')" class="flex toolbar-btn"
            @click="toggleFullScreen">
            <span class="tm-icon tm-full-screen-icon"></span>
          </div>
        </template>
        <slot name="toolbar-right"></slot>
      </div>
    </div>

    <div class="tm-full-tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "TMFullTabWrapper",
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    alwaysShowToolbar: {
      type: Boolean,
      default: false
    },
    fullScreenBgColor: {
      type: String,
      default: "var(--bg-main-color)"
    },
    pinTooltip: {
      type: String,
      default: ""
    },
    unpinTooltip: {
      type: String,
      default: ""
    },
    fullScreenTooltip: {
      type: String,
      default: ""
    },
    exitFullScreenTooltip: {
      type: String,
      default: ""
    },
    hidePin: {
      type: Boolean,
      default: false
    },
    // Trạng thái ghim BAN ĐẦU. true (mặc định) = thanh công cụ hiện sẵn,
    // giữ hành vi cũ. false = thanh thụt lên, chỉ hiện khi rê chuột; nút ghim
    // vẫn còn nên user tự ghim khi cần. Dùng cho app canvas (craft) vốn chiếm
    // gần hết chiều cao tab, thanh ghim sẵn là hàng phụ thừa.
    // hidePin vẫn ép không ghim vì khi ẩn nút ghim thì không có cách bật lại.
    defaultPinned: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isToolbarPinned: !this.hidePin && this.defaultPinned,
    };
  },
  computed: {
    wrapperStyle() {
      if (this.modelValue) {
        return { backgroundColor: this.fullScreenBgColor };
      }
      return {};
    }
  },
  methods: {
    pinToolbar() {
      this.isToolbarPinned = true;
    },
    unpinToolbar() {
      this.isToolbarPinned = false;
    },
    toggleFullScreen() {
      this.$emit("update:modelValue", !this.modelValue);
      if (this.modelValue && document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }
};
</script>

<style scoped lang="scss">
.tm-full-tab-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tm-full-tab-wrapper-active {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 1000 !important;
  height: 100% !important;
}

.tm-full-tab-content {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.fullscreen-toolbar {
  position: absolute;
  top: 0;
  left: 50%;
  display: flex;
  gap: 4px;
  background-color: var(--bg-layer-color);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  padding: 4px;
  transition: all 0.3s ease-in-out;
  z-index: 1001;
  transform: translateX(-50%) translateY(calc(-100% + 8px));
  opacity: 0.6;
  pointer-events: none;

  &:hover {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
  }

  &.toolbar-pinned {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }

  :deep(.toolbar-btn) {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;
    pointer-events: auto;

    &:hover {
      background-color: var(--focus-color);
      color: var(--selected-item-text-color);

      // Viền hover vẽ bằng inset box-shadow chứ không phải border.
      // Thêm border sẽ làm padding box lùi vào 1px, mọi child position:absolute
      // đều neo theo padding box (ví dụ badge đếm file trên nút tải file của tool
      // remote desktop) nên badge sẽ dịch 1px mỗi lần rê chuột vào nút.
      box-shadow: inset 0 0 0 1px var(--border-color);
    }
  }

  .tm-toolbar-utility-area {
    gap: var(--padding);
  }
}
</style>
