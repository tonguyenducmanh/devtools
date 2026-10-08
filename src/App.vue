<template>
  <div class="tm-container">
    <transition name="tm-fade-loading">
      <div v-if="appLoading" class="flex tm-loading-app"></div>
    </transition>
    <div class="tm-header-wrap">
      <TMHeaderApp />
    </div>
    <div class="flex tm-content-wrap">
      <div class="tm-sidebar-wrap">
        <TMSidebar />
      </div>
      <div class="tm-main">
        <TMDynamicTabView />
      </div>
    </div>
    <div class="tm-footer-wrap">
      <TMFooterApp />
    </div>
    <TMDynamicCursorEffect />
  </div>
</template>

<script>
import TMHeaderApp from "@/views/misc/TMHeaderApp.vue";
import TMFooterApp from "@/views/misc/TMFooterApp.vue";
import TMSidebar from "@/views/misc/TMSidebar.vue";
import TMDynamicTabView from "@/views/misc/TMDynamicTabView.vue";
import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";
import "@/common/TMPrototype.js";
import TMAppStartup from "@/common/TMAppStartup.js";
import TMDynamicCursorEffect from "@/views/cursorEffect/TMDynamicCursorEffect.vue";

export default {
  components: {
    TMHeaderApp,
    TMFooterApp,
    TMSidebar,
    TMDynamicTabView,
    TMDynamicCursorEffect,
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
    }, 200);

    // Set global app context for dialogs
    TMDialogUtil.setAppContext(this.$root.$.appContext);
  },
  beforeUnmount() {},
  methods: {
    /**
     * Xử lý 1 số kịch bản khi khởi chạy ứng dụng
     */
    async processWhenRunApp() {
      let me = this;
      await TMAppStartup.initialize();
      await me.showAgreementIfNotAccepted();
    },
    /**
     * Điều khoản sử dụng chỉ hiện 1 lần duy nhất: đóng popup xong thì lưu cờ
     * xuống cache, những lần mở app sau không hiện lại
     */
    async showAgreementIfNotAccepted() {
      let me = this;
      let cacheKey = me.$tmEnum.cacheConfig.AgreementAccepted;
      let accepted = await me.$tmCache.get(cacheKey);
      if (accepted) {
        return;
      }
      await TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMAgreementPopup,
        ownerForm: me,
        props: {},
        param: {},
        callback: () => me.$tmCache.set(cacheKey, true),
      });
    },
  },
};
</script>
<style lang="scss">
// không scope để dùng global style
@use "@/styles/main.scss";
.tm-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-size: var(--font-size-medium);
  background-color: var(--bg-layer-color);
  position: relative;
  .tm-loading-app {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background-color: var(--bg-main-color);
  }
  .tm-header-wrap {
    position: relative;
    border-radius: calc(var(--border-radius) * 1.5);
    width: 100%;
    height: 32px;
  }
  .tm-content-wrap {
    border-top: var(--border-component-style);
    border-bottom: var(--border-component-style);
    padding: var(--padding);
    width: 100%;
    min-height: 0;
    flex: 1;
    .tm-sidebar-wrap {
      border-radius: calc(var(--border-radius) * 1.5);
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .tm-main {
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
  .tm-footer-wrap {
    width: 100%;
    height: 32px;
    flex-shrink: 0;
  }
}
</style>
