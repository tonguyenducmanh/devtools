<template>
  <div class="td-container">
    <transition name="td-fade-loading">
      <div v-if="appLoading" class="flex td-loading-app">
        <div class="loader"></div>
      </div>
    </transition>

    <div class="flex td-content-wrap">
      <div class="td-sidebar-wrap">
        <TDSidebar />
      </div>
      <div class="td-main">
        <TDDynamicTabView />
      </div>
    </div>
    <TDFooterApp />
  </div>
</template>

<script>
import TDSidebar from "@/views/misc/TDSidebar.vue";
import TDDynamicTabView from "@/views/misc/TDDynamicTabView.vue";
import TDFooterApp from "@/views/misc/TDFooterApp.vue";
import TDShortcutAction from "@/common/TDShortcutAction.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";
import "@/common/TDPrototype.js";
import TDAppStartup from "@/common/TDAppStartup.js";

export default {
  components: { TDSidebar, TDDynamicTabView, TDFooterApp },
  created() {
    let me = this;
    me.registerShortcuts();
    me.processWhenRunApp();
  },
  data() {
    return {
      appLoading: true,
    };
  },
  async mounted() {
    await this.$nextTick();

    setTimeout(() => {
      this.appLoading = false;
    }, 500);
  },

  methods: {
    async processWhenRunApp() {
      let me = this;
      await TDAppStartup.initialize();
    },
    registerShortcuts() {
      TDShortcutAction.register("openSearch", {
        key: "p",
        labelKey: "i18nCommon.footer.search",
        tooltipKey: "i18nCommon.footer.searchTooltip",
        requireCtrl: true,
        action: () => {
          TDDialogUtil.showPopup({
            dialogType: TDDialogEnum.TDGoToToolPopup,
            ownerForm: this,
          });
        },
      });
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
  min-height: 0;
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
      min-width: 0;
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
