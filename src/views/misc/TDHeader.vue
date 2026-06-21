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
          :class="{ 'td-menu-item--active': activeKeyFlyOut === menuKey }"
          @mouseenter="openFlyout(menuKey, $event)"
          @mouseleave="scheduleCloseFlyout()"
        >
          <span>{{ $t(`i18nCommon.${menuKey}.title`) }}</span>
        </div>
      </div>
    </div>

    <!-- Flyout Menu: mở xuống dưới (placement="bottom") -->
    <TDFlyoutPanel
      :show="!!activeKeyFlyOut"
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

export default {
  name: "TDHeader",
  components: { TDFlyoutPanel },
  setup() {
    const { openTab, exitTabMode } = useTabManager();
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
      exitTabMode,
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
    reloadAppFunc() {
      this.$tdUtility.reloadApp();
      this.closeFlyout();
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
}
</style>
