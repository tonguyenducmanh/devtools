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
            :class="{ 'td-sidebar-item--active': activeKey === item.groupKey }"
            @mouseenter="open(item.groupKey, $event)"
            @mouseleave="scheduleClose()"
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

    <!-- Flyout: mở sang phải (placement="right"), tự lật sang trái nếu sát mép phải màn hình -->
    <TDFlyoutPanel
      :show="!!activeKey"
      :anchor-el="anchorEl"
      placement="right"
      panel-class="td-sidebar-group-flyout"
      @mouseenter="cancelClose"
      @mouseleave="scheduleClose()"
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

export default {
  name: "TDSidebar",
  components: { TDToggleArea, TDFlyoutPanel },

  setup() {
    const { openTab } = useTabManager();
    const { activeKey, anchorEl, open, scheduleClose, cancelClose, close } =
      useFlyout();
    return {
      openTab,
      activeKey,
      anchorEl,
      open,
      scheduleClose,
      cancelClose,
      close,
    };
  },

  data() {
    return {
      sidebarItems: getSidebarItems(),
      showSideBar: true,
    };
  },

  computed: {
    activeItem() {
      return (
        this.sidebarItems.find((item) => item.groupKey === this.activeKey) ??
        null
      );
    },
    activeChildren() {
      return this.activeItem?.children ?? [];
    },
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
      this.close();
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
