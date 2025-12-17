<template>
  <div
    class="td-sidebar-container"
    :class="{ 'td-sidebar-container-collapsed': !isShowSidebar }"
  >
    <div v-if="isShowSidebar" class="td-sidebar">
      <div class="td-tool-group">
        <template v-for="(item, index) in routerLink">
          <RouterLink
            class="td-sidebar-item"
            activeClass="td-item-active"
            :id="index"
            :to="item.pathVisible ?? item.path"
          >
            <div class="flex td-item-content">
              <div>{{ $t(item.meta.titleKey) }}</div>
            </div>
          </RouterLink>
        </template>
      </div>
    </div>
    <TDToggleArea
      :collapsed="!isShowSidebar"
      position="left"
      @toggle="isShowSidebar = !isShowSidebar"
    />
  </div>
</template>

<script>
import { getRouterConfig } from "@/router/router.js";
import TDToggleArea from "@/components/TDToggleArea.vue";
export default {
  name: "TDSidebar",
  components: { TDToggleArea },
  computed: {},
  created() {
    let me = this;
    me.processWhenCreated();
  },
  mounted() {},
  props: {},
  data() {
    let me = this;
    return {
      routerLink: getRouterConfig(),
      isShowSidebar: true,
      queryTool: null,
    };
  },
  methods: {
    filterToolNow() {
      let me = this;
      let allTool = getRouterConfig();
      if (me.queryTool && allTool && allTool.length > 0) {
        allTool.forEach((element) => {
          if (element.meta && element.meta.titleKey) {
            element.meta.title = me.$t(element.meta.titleKey);
          }
        });
        allTool = allTool.filter((x) =>
          x.meta.title.containsNotSentive(me.queryTool)
        );
      }
      me.routerLink = allTool;
    },
    async processWhenCreated() {
      let me = this;

      let toggleSidebarState = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.IsShowSidebar
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
@use "@/styles/icon.scss";

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
  height: calc(100% - var(--padding));
  background-color: var(--bg-main-color);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  transition: transform 0.3s ease-in-out;
  overflow-x: hidden;
  height: 100%;
  padding: var(--padding);
  border-radius: var(--border-radius);
  .td-filter-tool {
    display: flex;
    margin: var(--padding);
    width: calc(100% - 2 * var(--padding));
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
    &:hover {
      .td-item-content {
        background-color: var(--bg-layer-color);
      }
    }

    &.td-item-active {
      .td-item-content {
        background-color: var(--bg-layer-color);
      }
      font-weight: 600;
    }
  }

  .td-tool-group {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    width: 100%;
    max-height: calc(100vh - 60px);
  }
}

.td-menu {
  position: absolute;
  cursor: pointer;
  background-position: 0px 0px;
  z-index: 2;
  top: 0;
  left: 100%;
}
.td-sidebar {
  animation: slideIn 0.3s ease-out forwards;
}
</style>
