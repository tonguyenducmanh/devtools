<template>
  <div class="flex td-header-container">
    <div class="td-app-name">
      <!-- <div class="td-logo" @click="goToWelcome"></div> -->
      <div
        class="td-app-title"
        @click="goToWelcome"
        v-tooltip="$t('i18nCommon.feature.welcome')"
      >
        {{ appName }}
      </div>
      <div class="td-header-menu">
        <div
          v-for="(items, menuKey) in menuConfig"
          :key="menuKey"
          class="td-menu-item"
          :class="{ 'td-menu-item--active': activeKey === menuKey }"
          @mouseenter="open(menuKey, $event)"
          @mouseleave="scheduleClose()"
        >
          <span>{{ $t(`i18nCommon.${menuKey}.title`) }}</span>
        </div>
      </div>
    </div>

    <!-- Flyout Menu: mở xuống dưới (placement="bottom") -->
    <TDFlyoutPanel
      :show="!!activeKey"
      :anchor-el="anchorEl"
      placement="bottom"
      panel-class="td-header-flyout"
      @mouseenter="cancelClose"
      @mouseleave="scheduleClose()"
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

export default {
  name: "TDHeader",
  components: { TDFlyoutPanel },
  setup() {
    const { openTab, exitTabMode } = useTabManager();
    const { activeKey, anchorEl, open, scheduleClose, cancelClose, close } =
      useFlyout();
    return {
      openTab,
      exitTabMode,
      activeKey,
      anchorEl,
      open,
      scheduleClose,
      cancelClose,
      close,
    };
  },
  data() {
    return {
      menuConfig: {},
    };
  },
  computed: {
    appName() {
      return window.__env.appName;
    },
    currentMenuItems() {
      return this.menuConfig[this.activeKey] ?? [];
    },
  },
  mounted() {
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
  methods: {
    genUUIDFunc() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.$tdUtility.newGuid());
      this.close();
    },
    getCurrentDateFunc() {
      const now = new Date();
      const formatted = now.toISOString().split("T")[0];
      this.$tdUtility.copyToClipboard(formatted);
      this.close();
    },
    getCurrentDateTimeFunc() {
      const now = new Date();
      const formatted = now.toISOString().slice(0, 19).replace("T", " ");
      this.$tdUtility.copyToClipboard(formatted);
      this.close();
    },
    goToWelcome() {
      this.exitTabMode();
    },
    userSettingsFunc() {
      this.openTab({
        titleKey: "i18nCommon.feature.userSettings",
        groupPath: "",
        path: "/TDUserSettings",
        component: () => import("@/views/misc/TDUserSettings.vue"),
      });
      this.close();
    },
    appDataMinerFunc() {
      this.openTab({
        titleKey: "i18nCommon.feature.AppDataMiner",
        groupPath: "api",
        path: "/appdataminer",
        component: () => import("@/views/tools/TDAppDataMiner.vue"),
      });
      this.close();
    },
    goToSourceFunc() {
      this.$tdUtility.goToSource();
      this.close();
    },
    downloadAgentFunc() {
      const url = window.__env?.githubSource?.releasesUrl;
      window.open(url, "_blank");
      this.close();
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
      this.close();
    },
    reloadAppFunc() {
      this.$tdUtility.reloadApp();
      this.close();
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
    .td-logo {
      width: 24px;
      height: 24px;
      background: url(@/assets/favicon.ico);
      background-size: cover;
      cursor: pointer;
    }
    .td-app-title {
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
  }

  .td-header-menu {
    display: flex;
    align-items: center;
    gap: var(--padding);
  }

  .td-menu-item {
    display: flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: var(--border-radius-component);
    cursor: pointer;
    font-size: var(--font-size-medium-rare);
    color: var(--text-color);
    transition: background-color 0.15s ease;

    &:hover {
      background-color: var(--bg-layer-color);
    }

    &--active {
      background-color: var(--bg-layer-color);
    }
  }
}
</style>
