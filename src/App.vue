<template>
  <div class="td-container">
    <div class="td-header-wrap">
      <TDHeader />
    </div>
    <div class="flex td-content-wrap">
      <div class="td-sidebar-wrap">
        <TDSidebar />
      </div>
      <div class="td-main">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script>
import TDHeader from "@/views/TDHeader.vue";
import TDSidebar from "@/views/TDSidebar.vue";
import "@/common/TDPrototype.js";
import TDAppStartup from "@/common/TDAppStartup.js";
export default {
  components: { TDHeader, TDSidebar },
  created() {
    let me = this;
    me.logSomeInfo();
    me.processWhenRunApp();
  },
  data() {
    return {};
  },
  methods: {
    logSomeInfo() {
      let me = this;
      // let gitHubLink = null;
      // if (
      //   window.__env &&
      //   window.__env.githubSource &&
      //   window.__env.githubSource.url
      // ) {
      //   gitHubLink = window.__env.githubSource.url;
      // }
      // if (gitHubLink) {
      //   console.info(
      //     "%cWE LUV OPEN SOURCE",
      //     "margin:8px 0;font-family:sans-serif;font-weight:600;font-size:50px;color:#42b883;"
      //   );
      //   console.info(
      //     "%cContribute: " + gitHubLink,
      //     "margin:8px 0;font-family:sans-serif;font-weight:500;font-size:24px;color:#42b883;"
      //   );
      // }
    },
    /**
     * Xử lý 1 số kịch bản khi khởi chạy ứng dụng
     */
    async processWhenRunApp() {
      let me = this;
      let currentTheme = await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme);
      if (!currentTheme) {
        currentTheme = window.__env.defaultValue.theme;
        await me.$tdCache.set(me.$tdEnum.cacheConfig.Theme, currentTheme);
      }
      me.$tdUtility.setTheme(currentTheme);
      await TDAppStartup.initialize();
    },
  },
};
</script>
<style lang="scss">
@use "@/styles/main.scss";
.td-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-size: var(--font-size-medium);
  background-color: var(--bg-layer-color);
  .td-header-wrap {
    border-radius: calc(var(--border-radius) * 1.5);
    width: 100%;
    height: 50px;
  }
  .td-content-wrap {
    padding: var(--padding);
    column-gap: var(--padding);
    width: 100%;
    height: calc(100% - 50px);
    .td-sidebar-wrap {
      border-radius: calc(var(--border-radius) * 1.5);
      background-color: var(--bg-main-color);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .td-main {
      padding: var(--padding);
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: auto;
      position: relative;
      border-radius: calc(var(--border-radius) * 1.5);
      background-color: var(--bg-main-color);
    }
  }
}
</style>
