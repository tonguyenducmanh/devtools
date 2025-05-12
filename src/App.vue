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

export default {
  components: { TDSidebar },
  created() {
    let me = this;
    console.log(
      "App is running success: " + me.$tdUtility.formatDate(new Date())
    );
    me.processWhenRunApp();
  },
  data() {
    return {};
  },
  methods: {
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
