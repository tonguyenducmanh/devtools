<template>
  <div class="td-container">
    <TDSidebar />
    <div class="td-main">
      <RouterView />
    </div>
  </div>
</template>

<script>
import TDSidebar from "@/views/TDSidebar.vue";
import "@/common/TDPrototype.js";
import { loadLocale } from "@/i18n/i18nLoader.js";
export default {
  components: { TDSidebar },
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
      let gitHubLink = null;
      if (
        window.__env &&
        window.__env.githubSource &&
        window.__env.githubSource.url
      ) {
        gitHubLink = window.__env.githubSource.url;
      }
      if (gitHubLink) {
        console.info(
          "%cWE LUV OPEN SOURCE",
          "margin:8px 0;font-family:sans-serif;font-weight:600;font-size:50px;color:#42b883;"
        );
        console.info(
          "%cContribute: " + gitHubLink,
          "margin:8px 0;font-family:sans-serif;font-weight:500;font-size:24px;color:#42b883;"
        );
      }
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
      // Lấy ngôn ngữ hiện tại
      let currentLanguage = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.Language
      );
      let locale = currentLanguage ? currentLanguage : me.$tdEnum.language.en;
      loadLocale(locale);
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
  font-size: var(--font-size-medium);
  .td-main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
  }
}
</style>
