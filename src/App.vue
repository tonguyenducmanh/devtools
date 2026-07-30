<template>
  <div class="td-container">
    <transition name="td-fade-loading">
      <div v-if="appLoading" class="flex td-loading-app">
        <TDLoading />
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
        <TDDynamicTabView />
      </div>
    </div>
    <div class="td-footer-wrap">
      <TDFooterApp />
    </div>
    <TDCursorTrailEffect />
  </div>
</template>

<script>
import TDHeader from "@/views/misc/TDHeader.vue";
import TDFooterApp from "@/views/misc/TDFooterApp.vue";
import TDSidebar from "@/views/misc/TDSidebar.vue";
import TDDynamicTabView from "@/views/misc/TDDynamicTabView.vue";
import TDDialogUtil from "@/common/TDDialogUtil.js";
import "@/common/TDPrototype.js";
import TDAppStartup from "@/common/TDAppStartup.js";
import TDCursorTrailEffect from "@/components/backgroundEffect/TDCursorTrailEffect.vue";

export default {
  components: {
    TDHeader,
    TDFooterApp,
    TDSidebar,
    TDDynamicTabView,
    TDCursorTrailEffect,
  },
  created() {
    let me = this;
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

    // Set global app context for dialogs
    TDDialogUtil.setAppContext(this.$root.$.appContext);
    document.addEventListener("copy", this.handleCopyEventGlobal);
  },
  beforeUnmount() {
    document.removeEventListener("copy", this.handleCopyEventGlobal);
  },
  methods: {
    /**
     * Xử lý 1 số kịch bản khi khởi chạy ứng dụng
     */
    async processWhenRunApp() {
      let me = this;
      await TDAppStartup.initialize();
    },

    handleCopyEventGlobal(event) {
      let me = this;
      me.$tdUtility.handleCopyEvent(event);
    },
  },
};
</script>
<style lang="scss">
// không scope để dùng global style
@use "@/styles/main.scss";
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
    height: 32px;
  }
  .td-content-wrap {
    border-top: var(--border-component-style);
    border-bottom: var(--border-component-style);
    padding: var(--padding);
    width: 100%;
    min-height: 0;
    flex: 1;
    .td-sidebar-wrap {
      border-radius: calc(var(--border-radius) * 1.5);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .td-main {
      overflow: unset;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      height: 100%;
      position: relative;
      border-radius: calc(var(--border-radius) * 1.5);
      background-color: var(--bg-main-color);
    }
  }
  .td-footer-wrap {
    width: 100%;
    height: 32px;
    flex-shrink: 0;
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
