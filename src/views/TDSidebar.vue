<template>
  <div class="td-sidebar-container">
    <div
      class="td-icon td-menu"
      :class="{ 'td-menu-sibar-hide': !isShowSidebar }"
      @click="toggleSidebar"
    ></div>
    <div v-if="isShowSidebar" class="td-sidebar">
      <div class="td-filter-tool">
        <TDInput
          v-model="queryTool"
          :placeHolder="'Filter tool'"
          @keyup.enter="filterToolNow"
          @input="filterToolNow"
        />
      </div>
      <div class="td-tool-group">
        <template v-for="(item, index) in routerLink">
          <RouterLink
            class="td-sidebar-item"
            activeClass="td-item-active"
            :id="index"
            :to="item.pathVisible ?? item.path"
            >{{ item.meta.title }}</RouterLink
          >
        </template>
      </div>
      <div class="td-sidebar-bottom">
        <div
          class="td-icon td-theme-toggle"
          :class="{ 'td-theme-toggle-dark': isDarkTheme }"
          @click="toggleTheme"
        ></div>
        <div class="td-icon tg-github" @click="goToSource"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { routerConfig } from "@/router/router.js";

export default {
  name: "TDSidebar",
  components: {},

  created() {},
  mounted() {
    let me = this;
    me.processWhenMounted();
  },
  props: {},
  data() {
    return {
      routerLink: routerConfig,
      isShowSidebar: true,
      isDarkTheme: false,
      queryTool: null,
    };
  },
  methods: {
    filterToolNow() {
      let me = this;
      let allTool = routerConfig;
      if (me.queryTool && allTool && allTool.length > 0) {
        allTool = allTool.filter((x) =>
          x.meta.title.containsNotSentive(me.queryTool)
        );
      }
      me.routerLink = allTool;
    },
    async processWhenMounted() {
      let me = this;
      let currentTheme = await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme);
      if (!currentTheme) {
        currentTheme = window.__env.defaultValue.theme;
        await me.$tdCache.set(me.$tdEnum.cacheConfig.Theme, currentTheme);
      }
      me.isDarkTheme = currentTheme == me.$tdEnum.theme.dark;
      let toggleSidebarState = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.IsShowSidebar
      );
      if (toggleSidebarState) {
        me.isShowSidebar = toggleSidebarState.value;
      }
    },
    async toggleTheme() {
      let me = this;
      me.isDarkTheme = !me.isDarkTheme;
      let currentTheme = me.isDarkTheme
        ? me.$tdEnum.theme.dark
        : me.$tdEnum.theme.light;
      await me.$tdCache.set(me.$tdEnum.cacheConfig.Theme, currentTheme);
      me.$tdUtility.setTheme(currentTheme);
    },
    async toggleSidebar() {
      let me = this;
      me.isShowSidebar = !me.isShowSidebar;
      await me.$tdCache.set(me.$tdEnum.cacheConfig.IsShowSidebar, {
        value: me.isShowSidebar,
      });
    },
    goToSource() {
      let me = this;
      if (window.__env.githubSource && window.__env.githubSource.url) {
        window.open(window.__env.githubSource.url, "_blank").focus();
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.td-sidebar-container {
  position: relative;
}
.td-sidebar {
  position: relative;
  width: 250px;
  min-width: 250px;
  max-width: 250px;
  height: 100%;
  background-color: var(--bg-sub-color);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  .td-filter-tool {
    display: flex;
    margin: var(--padding);
  }
  .td-sidebar-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 30px;
    padding: var(--padding);
    padding-left: var(--padding-large);
  }
  .td-sidebar-item:hover {
    background-color: var(--bg-main-color);
  }
  .td-item-active {
    background-color: var(--bg-active-color);
  }
  .td-tool-group {
    flex: 1;
    overflow: auto;
    width: 100%;
  }
  .td-sidebar-bottom {
    position: relative;
    display: flex;
    column-gap: var(--padding);
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: var(--padding);
    .td-theme-toggle {
      cursor: pointer;
      background-position: -26px 0px;
    }
    .td-theme-toggle-dark {
      background-position: -48px 0px;
    }
    .tg-github {
      cursor: pointer;
      background-position: -76px 0px;
    }
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
</style>
