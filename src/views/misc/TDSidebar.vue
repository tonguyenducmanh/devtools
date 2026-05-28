<template>
  <div
    class="td-sidebar-container"
    :class="{ 'td-sidebar-container-collapsed': !showSideBar }"
  >
    <div v-if="showSideBar" class="td-sidebar">
      <div class="td-tool-group">
        <template v-for="(item, index) in sidebarItems" :key="index">
          <!-- Group item: hover → flyout -->
          <div
            v-if="item.type === 'group'"
            class="td-sidebar-item"
            :class="{ 'td-sidebar-item--active': hoveredItem === item }"
            @mouseenter="onGroupMouseEnter($event, item)"
            @mouseleave="onGroupMouseLeave"
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
      :collapsed="!showSideBar"
      edge="left"
      v-tooltip="
        showSideBar
          ? $t('i18nCommon.sidebar.hide')
          : $t('i18nCommon.sidebar.show')
      "
      @toggle="toggleSidebar"
    />

    <!-- Flyout -->
    <Teleport to="body">
      <Transition name="td-flyout">
        <div
          v-if="hoveredItem"
          class="td-sidebar-group-flyout"
          :style="flyoutStyle"
          @mouseenter="onFlyoutMouseEnter"
          @mouseleave="onFlyoutMouseLeave"
        >
          <div
            v-for="child in hoveredItem.children"
            :key="child.name"
            class="no-select td-sidebar-flyout-row"
          >
            <div
              class="td-sidebar-flyout-item"
              @click="onOpenGroupChildTab(hoveredItem, child)"
            >
              {{ $t(child.meta.titleKey) }}
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { getSidebarItems } from "@/stores/TDToolConfigs.js";
import TDToggleArea from "@/components/TDToggleArea.vue";
import { useTabManager } from "@/stores/TDTabManager.js";
import _ from "@/common/TDCommonFunction.js";

export default {
  name: "TDSidebar",
  components: { TDToggleArea },

  setup() {
    const { openTab } = useTabManager();
    return { openTab };
  },

  data() {
    return {
      sidebarItems: getSidebarItems(),
      showSideBar: true,
      hoveredItem: null,
      flyoutStyle: {},
      _leaveTimer: null,
    };
  },

  created() {
    this.processWhenCreated();
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

    onGroupMouseEnter(event, item) {
      clearTimeout(this._leaveTimer);
      const ITEM_HEIGHT = 42;
      const FLYOUT_PADDING = 12;
      const childCount = item.children?.length ?? 0;
      const rect = event.currentTarget.getBoundingClientRect();
      const flyoutHeight = childCount * ITEM_HEIGHT + FLYOUT_PADDING;
      const vh = window.innerHeight;

      let top = rect.top;
      if (top + flyoutHeight > vh - 8) top = vh - flyoutHeight - 8;
      if (top < 8) top = 8;

      this.flyoutStyle = {
        position: "fixed",
        top: `${top}px`,
        left: `${rect.right + 4}px`,
        zIndex: 10,
      };
      this.hoveredItem = item;
    },

    onGroupMouseLeave() {
      this._leaveTimer = setTimeout(() => {
        this.hoveredItem = null;
      }, 120);
    },

    onFlyoutMouseEnter() {
      clearTimeout(this._leaveTimer);
    },

    onFlyoutMouseLeave() {
      this._leaveTimer = setTimeout(() => {
        this.hoveredItem = null;
      }, 120);
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
      this.hoveredItem = null;
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
    background-color: var(--bg-layer-color);
  }

  &--active .td-item-content {
    background-color: var(--bg-layer-color);
  }

  // Nút pin chỉ hiện khi hover vào item
  &--route {
    &:hover .td-sidebar-pin-btn {
      opacity: 1;
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

<style lang="scss">
.td-flyout-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.td-flyout-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}
.td-flyout-enter-from,
.td-flyout-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.td-sidebar-group-flyout {
  background-color: var(--bg-main-color);
  border: 1px solid var(--bg-layer-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: calc(var(--padding) / 2);
  overflow: hidden;
  min-width: 200px;
}

.td-sidebar-flyout-row {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--border-radius-component);

  &:hover {
    background-color: var(--bg-layer-color);
    .td-flyout-pin-btn {
      opacity: 1;
    }
  }
}

.td-sidebar-flyout-item {
  flex: 1;
  display: block;
  padding: var(--padding);
  font-size: var(--font-size-medium-rare);
  color: var(--text-color);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.td-flyout-pin-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-right: 6px;
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
