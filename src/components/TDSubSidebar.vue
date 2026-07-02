<template>
  <!-- Trigger vô hình ở mép phải, fixed riêng -->
  <div
    v-if="zenMode"
    class="td-sub-sidebar-zen-trigger"
    @mouseenter="onZenMouseEnter"
    @mouseleave="onZenMouseLeave"
  ></div>
  <!--
    Trong zen mode, toàn bộ wrapper được fixed bên phải và trượt ra/vào.
    Các slot (menu, main) bên trong .td-sub-sidebar-content được cuộn theo.
  -->
  <div
    class="flex flex-col td-sub-sidebar-wrapper"
    :class="{
      'td-sub-sidebar-wrapper--zen': zenMode,
      'td-sub-sidebar-wrapper--zen-hover': zenHover,
    }"
    @mouseenter="onZenMouseEnter"
    @mouseleave="onZenMouseLeave"
  >
    <!-- phần nội dung sidebar -->
    <div
      class="flex td-sub-sidebar"
      :class="{
        'td-sub-sidebar-collaspe': !modelValue,
        'td-sub-sidebar-zen': zenMode,
      }"
    >
      <!-- phần thanh border ngăn cách main area và sidebar area -->
      <div v-show="showContent" class="divide"></div>
      <div v-show="showContent" class="flex flex-col td-sub-sidebar-content">
        <div v-show="$slots.menu" class="td-sidebar-menu">
          <slot name="menu" />
        </div>
        <slot name="main" />
      </div>
      <TDToggleArea
        v-if="!zenMode"
        :class="{ 'td-sub-sidebar-collaspe-toggle': !modelValue }"
        :collapsed="!modelValue"
        v-tooltip="modelValue ? computedHideTooltip : computedShowTooltip"
        edge="right"
        @toggle="toggleSidebar"
      />
    </div>
    <!-- hết phần nội dung sidebar -->
  </div>
</template>

<script>
import TDToggleArea from "@/components/TDToggleArea.vue";
import { appState } from "@/stores/TDAppState.js";
export default {
  name: "TDSubSidebar",
  components: { TDToggleArea },
  props: {
    modelValue: {
      type: Boolean,
      default: true,
    },
    showTooltip: {
      type: String,
      default: null,
    },
    hideTooltip: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      open: false,
      zenHover: false,
      zenHideTimer: null,
    };
  },
  beforeUnmount() {
    clearTimeout(this.zenHideTimer);
  },
  methods: {
    onZenMouseEnter() {
      clearTimeout(this.zenHideTimer);
      this.zenHover = true;
    },
    onZenMouseLeave() {
      clearTimeout(this.zenHideTimer);
      this.zenHideTimer = setTimeout(() => {
        this.zenHover = false;
      }, 400);
    },
    async toggleSidebar() {
      let me = this;
      me.$emit("update:modelValue", !me.modelValue);
      me.$emit("toggleSidebar");
    },
  },
  computed: {
    zenMode() {
      return appState.zenMode;
    },
    showContent() {
      return appState.zenMode || this.modelValue;
    },
    computedShowTooltip() {
      let me = this;
      if (me.showTooltip) {
        return me.showTooltip;
      } else {
        return me.$t("i18nCommon.subSidebar.showTooltip");
      }
    },
    computedHideTooltip() {
      let me = this;
      if (me.hideTooltip) {
        return me.hideTooltip;
      } else {
        return me.$t("i18nCommon.subSidebar.hideTooltip");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-sub-sidebar-wrapper {
  height: 100%;
}

.td-sub-sidebar {
  flex: 1;
  min-height: 0;
  position: relative;
  margin-left: var(--padding);
  .td-sub-sidebar-content {
    width: 300px;
    height: 100%;
    position: relative;
    padding-left: var(--padding);
  }
  .divide {
    width: var(--padding);
    height: 100%;
    background-color: var(--bg-layer-color);
    border-radius: var(--border-radius);
  }
}
.td-sub-sidebar-zen {
  margin-left: unset;
  .td-sub-sidebar-content {
    padding-left: unset;
  }
}
.td-sub-sidebar-collaspe {
  margin-left: unset;
}
.td-sub-sidebar-collaspe-toggle {
  margin-right: var(--padding);
}
.td-sidebar-menu {
  width: 100%;
  background-color: var(--bg-layer-color);
  border-radius: var(--border-radius);
}

// Zen hover trigger: fixed ở mép phải, chỉ vài px
.td-sub-sidebar-zen-trigger {
  position: fixed;
  right: 0;
  top: 0;
  width: var(--padding);
  height: 100vh;
  z-index: 99;
}

// Zen mode: floating panel with background, gaps, rounded corners
.td-sub-sidebar-wrapper--zen {
  position: fixed;
  right: var(--padding);
  top: 50px;
  height: calc(100vh - 100px);
  z-index: 100;
  transform: translateX(calc(100% + var(--padding)));
  transition:
    transform 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
  opacity: 0.6;
  background-color: var(--bg-main-color);
  border-radius: var(--border-radius);
  overflow: hidden;
  padding: var(--padding);

  .divide {
    display: none;
  }

  &:hover,
  &.td-sub-sidebar-wrapper--zen-hover {
    transform: translateX(0);
    opacity: 1;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }
}
</style>
