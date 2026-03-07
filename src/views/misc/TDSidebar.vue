<template>
  <div
    class="td-sidebar-container"
    :class="{ 'td-sidebar-container-collapsed': !isShowSidebar }"
  >
    <div v-if="isShowSidebar" class="td-sidebar">
      <div class="td-tool-group">
        <template v-for="(item, index) in sidebarItems" :key="index">
          <!-- Group item -->
          <div
            v-if="item.type === 'group'"
            class="td-sidebar-item"
            :class="{ 'td-item-active': isGroupActive(item.groupKey) }"
            @mouseenter="onGroupMouseEnter($event, item)"
            @mouseleave="onGroupMouseLeave"
          >
            <RouterLink class="flex td-item-content" :to="item.defaultPath">
              <span>{{ $t(item.groupTitleKey) }}</span>
            </RouterLink>
          </div>

          <!-- Standalone route item -->
          <RouterLink
            v-else
            class="td-sidebar-item"
            activeClass="td-item-active"
            :to="item.route.pathVisible ?? item.route.path"
          >
            <div
              class="flex td-item-content"
              v-tooltip="$t(item.route.meta.helpKey)"
            >
              <span>{{ $t(item.route.meta.titleKey) }}</span>
            </div>
          </RouterLink>
        </template>
      </div>
    </div>

    <TDToggleArea
      :collapsed="!isShowSidebar"
      edge="left"
      @toggle="toggleSidebar"
    />

    <!-- Flyout: teleport to body, outside all loops -->
    <Teleport to="body">
      <div
        v-if="hoveredItem"
        class="td-sidebar-group-flyout"
        :style="flyoutStyle"
        @mouseenter="onFlyoutMouseEnter"
        @mouseleave="onFlyoutMouseLeave"
      >
        <RouterLink
          v-for="child in hoveredItem.children"
          :key="child.name"
          class="td-sidebar-flyout-item"
          :to="`/${hoveredItem.groupPath}/${child.path}`"
          @click="hoveredItem = null"
          v-tooltip="$t(child.meta.helpKey)"
        >
          {{ $t(child.meta.titleKey) }}
        </RouterLink>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { getSidebarItems } from "@/router/router.js";
import TDToggleArea from "@/components/TDToggleArea.vue";

export default {
  name: "TDSidebar",
  components: { TDToggleArea },

  data() {
    return {
      sidebarItems: getSidebarItems(),
      isShowSidebar: true,
      hoveredItem: null,
      flyoutStyle: {},
      _leaveTimer: null,
    };
  },

  created() {
    this.processWhenCreated();
  },

  methods: {
    isGroupActive(groupKey) {
      return this.$route.meta?.groupKey === groupKey;
    },

    async processWhenCreated() {
      let me = this;
      let toggleSidebarState = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.IsShowSidebar,
      );
      if (toggleSidebarState) {
        me.isShowSidebar = toggleSidebarState.value;
      }
    },

    async toggleSidebar() {
      let me = this;
      me.isShowSidebar = !me.isShowSidebar;
      await me.$tdCache.set(me.$tdEnum.cacheConfig.IsShowSidebar, {
        value: me.isShowSidebar,
      });
    },

    onGroupMouseEnter(event, item) {
      clearTimeout(this._leaveTimer);
      const ITEM_HEIGHT = 38;
      const FLYOUT_PADDING = 16;
      const childCount = item.children?.length ?? 0;
      const triggerRect = event.currentTarget.getBoundingClientRect();
      const flyoutHeight = childCount * ITEM_HEIGHT + FLYOUT_PADDING;
      const viewportHeight = window.innerHeight;

      let top = triggerRect.top;
      if (top + flyoutHeight > viewportHeight - 8) {
        top = viewportHeight - flyoutHeight - 8;
      }
      if (top < 8) top = 8;

      this.flyoutStyle = {
        position: "fixed",
        top: `${top}px`,
        left: `${triggerRect.right + 4}px`,
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
  width: 250px;
  min-width: 250px;
  max-width: 250px;
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
    max-height: calc(100vh - 60px);
  }
}

.td-sidebar-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 45px;
  padding: var(--padding);
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  overflow: visible; // needed so flyout isn't clipped

  .td-item-content {
    justify-content: flex-start;
    column-gap: var(--padding);
    width: 100%;
    padding: var(--padding);
    border-radius: calc(var(--border-radius) * 1.5);
  }

  &:hover .td-item-content {
    background-color: var(--bg-layer-color);
  }

  &.td-item-active {
    font-weight: 600;

    .td-item-content {
      background-color: var(--bg-layer-color);
    }
  }
}
</style>

<!-- Flyout is teleported to body, so it needs non-scoped styles -->
<style lang="scss">
.td-sidebar-group-flyout {
  background-color: var(--bg-main-color);
  border: 1px solid var(--bg-layer-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: var(--padding);
  overflow: hidden;
  animation: flyoutIn 0.15s ease-out forwards;
}

@keyframes flyoutIn {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.td-sidebar-flyout-item {
  display: block;
  padding: var(--padding);
  font-size: var(--font-size-medium-rare);
  border-radius: var(--border-radius);
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--bg-layer-color);
  }
}
</style>
