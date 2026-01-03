<template>
  <div class="td-container">
    <transition name="td-fade-loading">
      <div v-if="appLoading" class="flex td-loading-app">
        <div class="loader"></div>
      </div>
    </transition>
    <div class="td-header-wrap" :class="{ 'td-header-hidden': !showHeader }">
      <TDHeader v-show="showHeader" />
      <TDToggleArea
        :collapsed="!showHeader"
        edge="top"
        @toggle="toggleHeader"
      />
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
import TDToggleArea from "@/components/TDToggleArea.vue";

export default {
  components: { TDHeader, TDSidebar, TDToggleArea },
  created() {
    let me = this;
    me.logSomeInfo();
    me.processWhenRunApp();
  },
  data() {
    return {
      appLoading: true,
      showHeader: true,
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
    async toggleHeader() {
      let me = this;
      me.showHeader = !me.showHeader;
      await me.$tdCache.set(me.$tdEnum.cacheConfig.IsShowHeader, {
        value: me.showHeader,
      });
    },
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
      let toggleHeader = await me.$tdCache.get(
        me.$tdEnum.cacheConfig.IsShowHeader
      );
      if (toggleHeader) {
        me.showHeader = toggleHeader.value;
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
    position: relative;
    border-radius: calc(var(--border-radius) * 1.5);
    width: 100%;
    height: 50px;
  }
  .td-header-hidden {
    height: 1px;
  }
  .td-content-wrap {
    padding: var(--padding);
    width: 100%;
    min-height: 0;
    flex: 1;
    .td-sidebar-wrap {
      border-radius: calc(var(--border-radius) * 1.5);
      // background-color: var(--bg-main-color);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .td-main {
      overflow: unset;
      padding: var(--padding);
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
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
