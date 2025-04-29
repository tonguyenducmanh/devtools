<template>
  <div class="td-container">
    <TDSidebar />
    <div class="td-main">
      <!-- <TDHeader></TDHeader> -->
      <RouterView />
    </div>
  </div>
</template>

<script>
import TDSidebar from "@/views/TDSidebar.vue";
import TDHeader from "@/views/TDHeader.vue";
import "@/common/TDPrototype.js";
export default {
  components: { TDSidebar, TDHeader },
  created() {
    let me = this;
    console.log("App is running success: " + new Date());
    me.processWhenRunApp();
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
      document.body.setAttribute("data-theme", currentTheme);
    },
  },
};
</script>
<style lang="scss">
@import "@/styles/main.scss";
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
  }
}
</style>
