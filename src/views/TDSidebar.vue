<template>
  <div class="td-sidebar">
    <template v-for="(item, index) in routerLink">
      <RouterLink
        class="td-sidebar-item"
        activeClass="td-item-active"
        :id="index"
        :to="item.pathVisible ?? item.path"
        >{{ item.title }}</RouterLink
      >
    </template>
    <div class="td-sidebar-bottom">
      <div
        class="td-icon td-theme-toggle"
        :class="{ 'td-theme-toggle-dark': isDarkTheme }"
        @click="toggleTheme"
      ></div>
    </div>
  </div>
</template>

<script>
import { routerConfig } from "@/router/index.js";
import _ from "@/common/TDUtility.js";

export default {
  name: "TDSidebar",
  components: {},

  created() {},
  mounted() {
    let me = this;
    let currentTheme = me.$tdCache.get(me.$tdEnum.cacheConfig.theme);
    if (!currentTheme) {
      currentTheme = window.__env.defaultValue.theme;
      me.$tdCache.set(me.$tdEnum.cacheConfig.theme, currentTheme);
    }
    me.isDarkTheme = currentTheme == me.$tdEnum.theme.dark;
  },
  methods: {},
  props: {},
  data() {
    return {
      routerLink: routerConfig,
      isDarkTheme: false,
    };
  },
  methods: {
    toggleTheme() {
      let me = this;
      me.isDarkTheme = !me.isDarkTheme;
      let currentTheme = me.isDarkTheme
        ? me.$tdEnum.theme.dark
        : me.$tdEnum.theme.light;
      me.$tdCache.set(me.$tdEnum.cacheConfig.theme, currentTheme);
      me.$tdUtility.setTheme(currentTheme);
    },
  },
};
</script>
<style lang="scss" scoped>
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
  .td-sidebar-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
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
  }
}
</style>
