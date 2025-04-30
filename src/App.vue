<template>
  <div class="td-container">
    <TDSidebar v-if="isShowSidebar" />
    <div class="td-main">
      <div class="td-icon td-menu" @click="toggleSidebar"></div>
      <div
        class="td-icon td-theme-toggle"
        :class="{ 'td-theme-toggle-dark': isDarkTheme }"
        @click="toggleTheme"
      ></div>
      <RouterView />
    </div>
  </div>
</template>

<script>
import TDSidebar from "@/views/TDSidebar.vue";
import "@/common/TDPrototype.js";
import _ from "@/common/TDUtility.js";

export default {
  components: { TDSidebar },
  created() {
    let me = this;
    console.log("App is running success: " + _.formatDate(new Date()));
    me.processWhenRunApp();
  },
  data() {
    return {
      isShowSidebar: true,
      isDarkTheme: false,
    };
  },
  methods: {
    /**
     * Xử lý 1 số kịch bản khi khởi chạy ứng dụng
     */
    processWhenRunApp() {
      let me = this;
      let currentTheme = me.$tdCache.get(me.$tdEnum.cacheConfig.theme);
      if (!currentTheme) {
        currentTheme = window.__env.defaultValue.theme;
        me.$tdCache.set(me.$tdEnum.cacheConfig.theme, currentTheme);
      }
      me.isDarkTheme = currentTheme == me.$tdEnum.theme.dark;
      me.$tdCache.set(me.$tdEnum.cacheConfig.theme, currentTheme);
      document.body.setAttribute("data-theme", currentTheme);
      let toggleSidebarState = me.$tdCache.get(
        me.$tdEnum.cacheConfig.isShowSidebar
      );
      if (toggleSidebarState) {
        me.isShowSidebar = toggleSidebarState.value;
      }
    },
    toggleSidebar() {
      let me = this;
      me.isShowSidebar = !me.isShowSidebar;
      me.$tdCache.set(me.$tdEnum.cacheConfig.isShowSidebar, {
        value: me.isShowSidebar,
      });
    },
    toggleTheme() {
      let me = this;
      me.isDarkTheme = !me.isDarkTheme;
      let currentTheme = me.isDarkTheme
        ? me.$tdEnum.theme.dark
        : me.$tdEnum.theme.light;
      me.$tdCache.set(me.$tdEnum.cacheConfig.theme, currentTheme);
      document.body.setAttribute("data-theme", currentTheme);
    },
  },
};
</script>
<style lang="scss">
@use "@/styles/main.scss";
.td-container {
  display: flex;
  width: 100%;
  height: 100%;
  .td-main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
    .td-menu {
      position: absolute;
      cursor: pointer;
      background-position: 0px 0px;
    }
    .td-theme-toggle {
      position: absolute;
      right: 0;
      top: 0;
      cursor: pointer;
      background-position: -20px 0px;
    }
    .td-theme-toggle-dark {
      background-position: -40px 0px;
    }
  }
}
</style>
