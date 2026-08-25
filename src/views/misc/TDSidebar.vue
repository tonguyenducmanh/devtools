<template>
  <!-- Trigger vô hình ở mép trái, fixed riêng không bị ảnh hưởng bởi transform -->
  <div
    v-if="zenMode"
    class="td-sidebar-zen-trigger"
    @mouseenter="onZenMouseEnter"
    @mouseleave="onZenMouseLeave"
  ></div>
  <div
    class="td-sidebar-container"
    :class="{ 'td-sidebar-container-collapsed': !showSideBar }"
  >
    <div
      v-if="showSideBar || zenMode"
      class="td-sidebar"
      :class="{
        'td-sidebar--zen': zenMode,
        'td-sidebar--zen-hover': zenHover,
      }"
      @mouseenter="onZenMouseEnter"
      @mouseleave="onZenMouseLeave"
    >
      <div class="td-tool-group">
        <template v-for="(item, index) in sidebarItems" :key="index">
          <!-- Group item: hover → flyout -->
          <div
            v-if="item.type === 'group'"
            class="td-sidebar-item"
            :class="{
              'td-sidebar-item--active': activeKeyFlyOut === item.groupKey,
            }"
            @mouseenter="openFlyout(item.groupKey, $event)"
            @mouseleave="scheduleCloseFlyout()"
          >
            <div
              class="flex no-select td-item-content"
              @click="onOpenGroup(item)"
            >
              <span>{{ $t(item.groupTitleKey) }}</span>
            </div>
          </div>

          <!-- Standalone route item: link + nút pin -->
          <div v-else class="td-sidebar-item td-sidebar-item--route">
            <div
              class="no-select td-item-content flex"
              @click="onOpenRouteTab(item.route)"
            >
              <span>{{ $t(item.route.meta.titleKey) }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <TDToggleArea
      v-if="!zenMode"
      :collapsed="!showSideBar"
      edge="left"
      v-tooltip="
        showSideBar
          ? $t('i18nCommon.sidebar.hide')
          : $t('i18nCommon.sidebar.show')
      "
      @toggle="toggleSidebar"
    />

    <!-- Flyout: mở sang phải (placement="right"), tự lật sang trái nếu sát mép phải màn hình -->
    <TDFlyoutPanel
      :show="!!activeKeyFlyOut"
      :anchorElFlyout="anchorElFlyout"
      placement="right"
      panelClass="td-sidebar-group-flyout"
      @mouseenter="cancelCloseFlyOut"
      @mouseleave="scheduleCloseFlyout()"
    >
      <div
        v-for="child in activeChildren"
        :key="child.name"
        class="no-select td-sidebar-flyout-row"
      >
        <div
          class="td-sidebar-flyout-item"
          @click="onOpenGroupChildTab(activeItem, child)"
        >
          {{ $t(child.meta.titleKey) }}
        </div>
      </div>
    </TDFlyoutPanel>
  </div>
</template>

<script>
import { getSidebarItems } from "@/stores/TDToolConfigs.js";
import TDToggleArea from "@/components/TDToggleArea.vue";
import TDFlyoutPanel from "@/components/TDFlyoutPanel.vue";
import { useTabManager } from "@/stores/TDTabManager.js";
import { useFlyout } from "@/common/plugin/TDUseFlyout.js";
import _ from "@/common/TDCommonFunction.js";
import { appState } from "@/stores/TDAppState.js";

export default {
  name: "TDSidebar",
  components: { TDToggleArea, TDFlyoutPanel },

  setup() {
    const { openTab } = useTabManager();
    const {
      activeKeyFlyOut,
      anchorElFlyout,
      openFlyout,
      scheduleCloseFlyout,
      cancelCloseFlyOut,
      closeFlyout,
    } = useFlyout();
    return {
      openTab,
      activeKeyFlyOut,
      anchorElFlyout,
      openFlyout,
      scheduleCloseFlyout,
      cancelCloseFlyOut,
      closeFlyout,
    };
  },

  data() {
    return {
      sidebarItems: getSidebarItems(),
      showSideBar: true,
      zenHover: false,
      zenHideTimer: null,
    };
  },

  computed: {
    zenMode() {
      return appState.zenMode;
    },
    activeItem() {
      return (
        this.sidebarItems.find(
          (item) => item.groupKey === this.activeKeyFlyOut,
        ) ?? null
      );
    },
    activeChildren() {
      return this.activeItem?.children ?? [];
    },
  },

  created() {
    this.processWhenCreated();
  },

  beforeUnmount() {
    clearTimeout(this.zenHideTimer);
  },

  methods: {
    async processWhenCreated() {
      let me = this;
      me.showSideBar = await me.$tdUtility.getUserSettings("showSideBar");
    },

    async toggleSidebar() {
      let me = this;
      me.showSideBar = !me.showSideBar;
      await me.$tdUtility.saveUserSettings("showSideBar", me.showSideBar);
    },

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

    // Mở tất từ group
    onOpenGroup: _.debounce(async function (groupItem) {
      if (!groupItem.children || groupItem.children.length === 0) return;
      // chỉ mở tab đầu tiên
      const child = groupItem.children[0];
      await this.openTab({
        titleKey: child.meta.titleKey,
        helpKey: child.meta?.helpKey,
        groupKey: groupItem.groupKey,
        toolKey: child.name,
        component: child.component,
      });
    }, 300),

    // Mở tab từ group flyout item
    onOpenGroupChildTab: _.debounce(function (groupItem, child) {
      this.openTab({
        titleKey: child.meta.titleKey,
        helpKey: child.meta?.helpKey,
        groupKey: groupItem.groupKey,
        toolKey: child.name,
        component: child.component,
      });
      this.closeFlyout();
    }, 300),

    // Mở tab từ standalone route item
    onOpenRouteTab: _.debounce(function (route) {
      this.openTab({
        titleKey: route.meta.titleKey,
        helpKey: route.meta?.helpKey,
        groupKey: "",
        toolKey: route.name,
        // Standalone route dùng component trực tiếp từ route config
        component: route.component,
      });
    }, 300),
  },
};
</script>

<style lang="scss" scoped>
.td-sidebar-container {
  position: relative;
  height: 100%;
  margin-right: var(--padding);
}
.td-sidebar-container-collapsed {
  margin-right: unset;
}
.td-sidebar {
  position: relative;
  width: 210px;
  min-width: 210px;
  max-width: 210px;
  height: 100%;
  background-color: var(--bg-main-color);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  transition: transform 0.3s ease-in-out;
  overflow-x: hidden;
  padding: var(--padding);
  border-radius: var(--border-radius);
  animation: slideIn 0.3s ease-out forwards;
  border: var(--border-component-style);
  .td-tool-group {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
  }
}

.td-sidebar-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 45px;
  padding: var(--padding);
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: visible;

  .td-item-content {
    flex: 1;
    justify-content: space-between;
    column-gap: var(--padding);
    padding: var(--padding);
    border-radius: var(--border-radius-component);
    text-decoration: none;
    color: var(--text-color);
    min-width: 0;
    cursor: pointer;
  }

  &:hover .td-item-content {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }

  &--active .td-item-content {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }

  // Nút pin chỉ hiện khi hover vào item
  &--route {
    &:hover .td-sidebar-pin-btn {
      opacity: 1;
    }
  }
}

// Zen hover trigger: fixed ở mép trái, chỉ vài px, chừa khoảng toolbar phía trên
.td-sidebar-zen-trigger {
  position: fixed;
  left: 0;
  top: 50px;
  width: var(--padding);
  height: calc(100vh - 50px);
  z-index: 99;
}

// Zen mode: floating panel with gaps and rounded corners
.td-sidebar--zen {
  position: fixed;
  left: var(--padding);
  top: 50px;
  height: calc(100vh - 100px);
  z-index: 100;
  transform: translateX(calc(-100% - var(--padding)));
  transition:
    transform 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
  opacity: 0.6;
  animation: none;
  border-radius: var(--border-radius);
  border: none;
  padding: 4px;
  overflow: hidden;

  .td-tool-group {
    overflow: hidden;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &:hover,
  &.td-sidebar--zen-hover {
    transform: translateX(0);
    opacity: 1;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

    .td-tool-group {
      overflow-y: auto;
      scrollbar-width: thin;
      &::-webkit-scrollbar {
        display: block;
      }
    }
  }
}

.td-sidebar-pin-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 2px;
  border-radius: calc(var(--border-radius) * 0.75);
  border: none;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    opacity: 1;
  }
}
</style>
