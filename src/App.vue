<template>
  <div class="td-container">
    <transition name="td-fade-loading">
      <div v-if="appLoading" class="flex td-loading-app">
        <div class="loader"></div>
      </div>
    </transition>
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
    return {
      appLoading: true,
    };
  },
  async mounted() {
    // Đợi toàn bộ DOM + component con render xong
    await this.$nextTick();

    // Có thể delay nhẹ để tránh giật UI (tuỳ chọn)
    setTimeout(() => {
      this.appLoading = false;
    }, 500);
  },

  methods: {
    logSomeInfo() {
      let me = this;
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
@use "@/styles/tooltip.scss";
.td-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-size: var(--font-size-medium);
  background-color: var(--bg-layer-color);
  position: relative;
  .td-loading-app {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background-color: var(--bg-main-color);
  }
  .td-header-wrap {
    border-radius: calc(var(--border-radius) * 1.5);
    width: 100%;
    height: 50px;
  }
  .td-content-wrap {
    padding: var(--padding);
    width: 100%;
    height: calc(100% - 50px);
    .td-sidebar-wrap {
      border-radius: calc(var(--border-radius) * 1.5);
      // background-color: var(--bg-main-color);
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
.td-fade-loading-enter-active,
.td-fade-loading-leave-active {
  transition: opacity 0.4s ease;
}

.td-fade-loading-enter-from,
.td-fade-loading-leave-to {
  opacity: 0;
}

.td-fade-loading-enter-to,
.td-fade-loading-leave-from {
  opacity: 1;
}
</style>
