<!-- component hiển thị dynamic group view của các tính năng mà user chủ động chọn thành nhiều tab 
support cùng 1 tính năng được phép hiển thị thành nhiều lần
-->
<template>
  <div class="td-tab-view">
    <!-- Tab bar: chỉ hiện khi có tab -->
    <Transition name="td-tabbar">
      <div v-if="isTabMode" class="td-tab-bar">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="td-tab-item"
          :class="{ 'td-tab-active': activeTabId === tab.id }"
          @click="activateTab(tab.id)"
          v-tooltip="$t(tab.helpKey)"
        >
          <span class="td-tab-label">{{ $t(tab.titleKey) }}</span>

          <button
            class="td-tab-close"
            @click.stop="closeTab(tab.id)"
            v-tooltip="$t('i18nCommon.tabManager.closeTab')"
          >
            <span class="td-icon td-close-icon"> </span>
          </button>
        </div>

        <!-- Nút đóng tất cả -->
        <button
          class="td-tab-exit-btn"
          @click="exitTabMode"
          v-tooltip="$t('i18nCommon.tabManager.closeAllTabs')"
        >
          <span class="td-icon td-close-icon"> </span>
        </button>
      </div>
    </Transition>

    <!-- Content area -->
    <div class="td-tab-content">
      <!-- Tab mode: render sẵn tất cả bằng v-show -->
      <template v-if="isTabMode">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          v-show="activeTabId === tab.id"
          class="td-tab-pane"
        >
          <component :is="tab.resolvedComponent" v-if="tab.resolvedComponent" />
        </div>
      </template>

      <!-- Normal mode: router-view như cũ -->
      <RouterView v-else />
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { useTabManager } from "@/stores/TDTabManager.js";

export default {
  name: "TDTabView",

  setup() {
    const { state, activateTab, closeTab } = useTabManager();

    const tabs = computed(() => state.tabs);
    const activeTabId = computed(() => state.activeTabId);
    const isTabMode = computed(() => state.tabs.length > 0);

    function exitTabMode() {
      state.tabs.splice(0, state.tabs.length);
      state.activeTabId = null;
    }

    return { tabs, activeTabId, isTabMode, activateTab, closeTab, exitTabMode };
  },
};
</script>

<style lang="scss" scoped>
.td-tab-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.td-tabbar-enter-active {
  transition:
    max-height 0.2s ease,
    opacity 0.2s ease;
}
.td-tabbar-leave-active {
  transition:
    max-height 0.15s ease,
    opacity 0.15s ease;
}
.td-tabbar-enter-from,
.td-tabbar-leave-to {
  max-height: 0;
  opacity: 0;
}
.td-tabbar-enter-to,
.td-tabbar-leave-from {
  max-height: 48px;
  opacity: 1;
}

.td-tab-bar {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 2px;
  border-bottom: 2px solid var(--bg-layer-color);
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--bg-layer-color);
    border-radius: 2px;
  }
}

.td-tab-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: var(--padding);
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-secondary-color);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  user-select: none;

  &:hover {
    background-color: var(--bg-layer-color);
    color: var(--text-color);
    .td-tab-close {
      opacity: 0.6;
    }
  }

  &.td-tab-active {
    color: var(--text-color);
    font-weight: 600;
    background-color: var(--bg-layer-color);
    .td-tab-close {
      opacity: 0.5;
    }
  }
}

.td-tab-label {
  font-size: var(--font-size-medium-rare);
}

.td-tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    opacity: 1 !important;
  }
}

.td-tab-exit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin-left: auto;
  margin-right: 4px;
  align-self: center;
  border: none;
  background: transparent;
  color: var(--text-secondary-color);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

/* ── Content ── */
.td-tab-content {
  flex: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.td-tab-pane {
  width: 100%;
  height: 100%;
}
</style>
