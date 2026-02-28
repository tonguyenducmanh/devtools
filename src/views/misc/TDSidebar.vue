<template>
  <div
    class="td-sidebar-container"
    :class="{ 'td-sidebar-container-collapsed': !isShowSidebar }"
  >
    <div v-if="isShowSidebar" class="td-sidebar">
      <div class="td-tool-group">
        <template v-for="(item, index) in sidebarItems" :key="index">
          <!-- Group item: chỉ hiển thị tên group, không có children -->
          <RouterLink
            v-if="item.type === 'group'"
            class="td-sidebar-item"
            :class="{ 'td-item-active': isGroupActive(item.groupKey) }"
            :to="item.defaultPath"
          >
            <div class="flex td-item-content">
              <span>{{ $t(item.groupTitleKey) }}</span>
            </div>
          </RouterLink>

          <!-- Standalone route item -->
          <RouterLink
            v-else
            class="td-sidebar-item"
            activeClass="td-item-active"
            :to="item.route.pathVisible ?? item.route.path"
          >
            <div
              class="flex td-item-content"
              v-tooltip="
                item.route.meta.helpKey
                  ? $t(item.route.meta.helpKey)
                  : undefined
              "
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
    };
  },

  created() {
    this.processWhenCreated();
  },

  methods: {
    /**
     * Group được coi là active khi route hiện tại có cùng groupKey
     * (tức là đang đứng ở bất kỳ tool nào trong group đó)
     */
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
  overflow: hidden;
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
