<template>
  <div class="flex td-header-container">
    <div class="td-app-name">
      <div class="td-app-brand" @click="reloadAppFunc">
        <div class="td-logo td-logo-tool-app"></div>
        <div class="td-app-title">
          {{ appName }}
        </div>
      </div>
      <div class="td-header-menu">
        <div
          v-for="(items, menuKey) in menuConfig"
          :key="menuKey"
          class="td-menu-item"
          :class="{ 'td-menu-item--active': activeKeyFlyOut === menuKey }"
          @mouseenter="openFlyout(menuKey, $event)"
          @mouseleave="scheduleCloseFlyout()"
        >
          <span>{{ $t(`i18nCommon.${menuKey}.title`) }}</span>
        </div>
      </div>
    </div>

    <div class="td-header-right">
      <div class="td-header-toast">
        <div
          v-if="currentHeaderToast"
          :class="[
            'td-header-toast-item',
            `td-header-toast--${currentHeaderToast.type}`,
          ]"
          @click="removeHeaderToast(currentHeaderToast.id)"
        >
          {{ currentHeaderToast.message }}
        </div>
      </div>
    </div>

    <!-- Flyout Menu: mở xuống dưới (placement="bottom") -->
    <TDFlyoutPanel
      :show="!!activeKeyFlyOut && activeKeyFlyOut !== 'logo'"
      :anchorElFlyout="anchorElFlyout"
      placement="bottom"
      panelClass="td-header-flyout"
      @mouseenter="cancelCloseFlyOut"
      @mouseleave="scheduleCloseFlyout()"
    >
      <div
        v-for="item in currentMenuItems"
        :key="item.key"
        class="td-flyout-item"
                v-tooltip="item.tooltip"
        @click="item.action"
      >
        {{ $t(item.labelKey) }}
      </div>
    </TDFlyoutPanel>
  </div>
</template>

<script>
import { useTabManager } from "@/stores/TDTabManager.js";
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";
import TDFlyoutPanel from "@/components/TDFlyoutPanel.vue";
import { useFlyout } from "@/common/plugin/TDUseFlyout.js";
import eventBus from "@/common/event/TDEventBus.js";
import { TDEnumEventBus } from "@/common/event/TDEnumEventBus.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

export default {
  name: "TDHeader",
  components: { TDFlyoutPanel },
  setup() {
    const { openTab } = useTabManager();
    const {
      activeKeyFlyOut,
      anchorElFlyout,
      openFlyout,
      scheduleCloseFlyout,
      cancelCloseFlyOut,
      closeFlyout,
    } = useFlyout();
    return {
      openTab,
      activeKeyFlyOut,
      anchorElFlyout,
      openFlyout,
      scheduleCloseFlyout,
      cancelCloseFlyOut,
      closeFlyout,
    };
  },
  data() {
    return {
      menuConfig: {},
      logoItems: [],
      headerToastIdCounter: 0,
      currentHeaderToast: null,
      headerToastTimer: null,
      headerToastUnsubscribe: null,
    };
  },
  computed: {
    appName() {
      return window.__env.appName;
    },
    currentMenuItems() {
      return this.menuConfig[this.activeKeyFlyOut] ?? [];
    },
  },
  mounted() {
    this.headerToastUnsubscribe = eventBus.on(
      TDEnumEventBus.headerToastShow,
      this.onHeaderToastShow,
    );
    this.logoItems = [
      {
        key: "tool",
        logoClass: "td-logo-tool-app",
        label: window.__env?.appName ?? "Tools",
        action: () => this.openOtherApp(window.location.href),
      },
    ];
    this.menuConfig = {
      settings: [
        {
          key: "userSettings",
          labelKey: "i18nCommon.feature.userSettings",
          action: this.userSettingsFunc,
        },
        {
          key: "appDataMiner",
          labelKey: "i18nCommon.feature.AppDataMiner",
          action: this.appDataMinerFunc,
        },
      ],
      view: [
        {
          key: "zenMode",
          labelKey: "i18nCommon.tdheader.zenMode",
          action: this.toggleZenMode,
        },
        {
          key: "showAllShortcut",
          labelKey: "i18nCommon.tdheader.showAllShortcut",
          action: this.showAllShortcutPopup,
        },
      ],
      utilities: [
        {
          key: "genUUID",
          labelKey: "i18nCommon.help.genUUID",
          action: this.genUUIDFunc,
        },
        {
          key: "getCurrentDate",
          labelKey: "i18nCommon.utilities.getCurrentDate",
          action: this.getCurrentDateFunc,
        },
        {
          key: "getCurrentDateTime",
          labelKey: "i18nCommon.utilities.getCurrentDateTime",
          action: this.getCurrentDateTimeFunc,
        },
      ],
      help: [
        {
          key: "pingAgent",
          labelKey: "i18nCommon.apiTesting.pingAgent",
          action: this.pingAgentFunc,
        },
        {
          key: "reloadApp",
          labelKey: "i18nCommon.help.reloadApp",
          action: this.reloadAppFunc,
        },
        {
          key: "goToSource",
          labelKey: "i18nCommon.tdheader.goToSource",
          action: this.goToSourceFunc,
        },
        {
          key: "downloadAgent",
          labelKey: "i18nCommon.feature.agentDownload.title",
          tooltip: this.$t("i18nCommon.apiTesting.toolTipDownloadAgent"),
          action: this.downloadAgentFunc,
        },
      ],
    };
  },
  beforeUnmount() {
    if (this.headerToastUnsubscribe) {
      this.headerToastUnsubscribe();
    }
  },
  methods: {
    genUUIDFunc() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.$tdUtility.newGuid());
      this.closeFlyout();
    },
    getCurrentDateFunc() {
      const now = new Date();
      const formatted = now.toISOString().split("T")[0];
      this.$tdUtility.copyToClipboard(formatted);
      this.closeFlyout();
    },
    getCurrentDateTimeFunc() {
      const now = new Date();
      const formatted = now.toISOString().slice(0, 19).replace("T", " ");
      this.$tdUtility.copyToClipboard(formatted);
      this.closeFlyout();
    },
    openOtherApp(url) {
      window.open(url, "_blank");
      this.closeFlyout();
    },
    userSettingsFunc() {
      this.openTab({
        titleKey: "i18nCommon.feature.userSettings",
        groupPath: "",
        path: "/TDUserSettings",
        component: () => import("@/views/misc/TDUserSettings.vue"),
      });
      this.closeFlyout();
    },
    appDataMinerFunc() {
      this.openTab({
        titleKey: "i18nCommon.feature.AppDataMiner",
        groupPath: "api",
        path: "/appdataminer",
        component: () => import("@/views/tools/TDAppDataMiner.vue"),
      });
      this.closeFlyout();
    },
    goToSourceFunc() {
      this.$tdUtility.goToSource();
      this.closeFlyout();
    },
    downloadAgentFunc() {
      const url = window.__env?.githubSource?.releasesUrl;
      window.open(url, "_blank");
      this.closeFlyout();
    },
    async pingAgentFunc() {
      try {
        const res = await new TDAgentAPI().heathCheck();
        if (res?.success && res?.data) {
          this.$tdToast.success(res.data);
        } else {
          this.$tdToast.success(res);
        }
      } catch {
        this.$tdUtility.showErrorNotFoundAgentServer();
      }
      this.closeFlyout();
    },
    toggleZenMode() {
      eventBus.emit(TDEnumEventBus.zenModeToggle);
      this.closeFlyout();
    },
    showAllShortcutPopup() {
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDShowAllShortcutPopup,
        ownerForm: this,
        props: {},
      });
      this.closeFlyout();
    },
    reloadAppFunc() {
      this.$tdUtility.reloadApp();
      this.closeFlyout();
    },
    onHeaderToastShow(data) {
      this.addHeaderToast(data);
    },
    addHeaderToast(config) {
      if (this.headerToastTimer) {
        clearTimeout(this.headerToastTimer);
      }
      const id = ++this.headerToastIdCounter;
      this.currentHeaderToast = {
        id,
        type: config.type || "info",
        message: config.message || "",
        duration: config.duration || 1500,
      };
      this.headerToastTimer = setTimeout(() => {
        this.removeHeaderToast(id);
      }, this.currentHeaderToast.duration);
    },
    removeHeaderToast(id) {
      if (this.currentHeaderToast && this.currentHeaderToast.id === id) {
        this.currentHeaderToast = null;
        this.headerToastTimer = null;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-header-container {
  width: 100%;
  height: 100%;
  background-color: var(--bg-main-color);
  justify-content: space-between;
  padding: var(--padding) calc(var(--padding) * 1.5);

  .td-app-name {
    display: flex;
    align-items: center;
    gap: var(--padding);
    .td-app-brand {
      display: flex;
      align-items: center;
      gap: var(--padding);
      cursor: pointer;
    }
    .td-app-title {
      font-size: 14px;
      font-weight: 700;
    }
  }

  .td-header-menu {
    display: flex;
    align-items: center;
    gap: var(--padding);
  }

  .td-header-right {
    display: flex;
    align-items: center;
    gap: var(--padding);
    margin-left: auto;
  }

  .td-header-toast {
    display: flex;
    align-items: center;
    overflow: hidden;
    .td-header-toast-item {
      font-size: 12px;
      padding: 2px 8px;
      cursor: pointer;
      white-space: nowrap;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .td-header-toast--success {
      color: #10b981;
    }

    .td-header-toast--error {
      color: #ef4444;
    }

    .td-header-toast--warning {
      color: #d97706;
    }

    .td-header-toast--info {
      color: #3b82f6;
    }
  }
}
</style>
