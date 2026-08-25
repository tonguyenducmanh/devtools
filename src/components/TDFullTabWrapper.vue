<template>
  <div class="td-full-tab-wrapper" :class="{ 'td-full-tab-wrapper-active': modelValue }" :style="wrapperStyle">
    <div class="fullscreen-toolbar" :class="{ 'toolbar-pinned': isToolbarPinned }"
      v-if="modelValue || alwaysShowToolbar">
      <template v-if="!hidePin">
        <template v-if="isToolbarPinned">
          <div v-tooltip="unpinTooltip || $t('i18nCommon.remoteDesktop.unpin')" class="flex toolbar-btn"
            @click="unpinToolbar">
            <span class="td-icon td-unpin-icon"></span>
          </div>
        </template>
        <template v-else>
          <div v-tooltip="pinTooltip || $t('i18nCommon.remoteDesktop.pin')" class="flex toolbar-btn"
            @click="pinToolbar">
            <span class="td-icon td-pin-icon"></span>
          </div>
        </template>
      </template>

      <div class="flex td-toolbar-utility-area">
        <slot name="toolbar-left"></slot>
        <template v-if="modelValue">
          <div v-tooltip="exitFullScreenTooltip || $t('i18nCommon.remoteDesktop.closeFullTab')" class="flex toolbar-btn"
            @click="toggleFullScreen">
            <span class="td-icon td-exit-full-screen-icon"></span>
          </div>
        </template>
        <template v-else>
          <div v-tooltip="fullScreenTooltip || $t('i18nCommon.remoteDesktop.fullTab')" class="flex toolbar-btn"
            @click="toggleFullScreen">
            <span class="td-icon td-full-screen-icon"></span>
          </div>
        </template>
        <slot name="toolbar-right"></slot>
      </div>
    </div>

    <div class="td-full-tab-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDFullTabWrapper",
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
    }
  },
  data() {
    return {
      isToolbarPinned: !this.hidePin,
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
.td-full-tab-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.td-full-tab-wrapper-active {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 1000 !important;
  height: 100% !important;
}

.td-full-tab-content {
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

  &:hover {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -50px;
    right: -50px;
    bottom: -20px;
    z-index: -1;
  }

  &.toolbar-pinned {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  :deep(.toolbar-btn) {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;

    &:hover {
      background-color: var(--bg-focus-color);
      color: var(--selected-item-text-color);

      border: 1px solid var(--border-color);
    }
  }

  .td-toolbar-utility-area {
    gap: var(--padding);
  }
}
</style>
