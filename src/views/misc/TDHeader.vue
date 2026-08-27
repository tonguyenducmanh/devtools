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
        <div v-for="(items, menuKey) in menuConfig" :key="menuKey" class="td-menu-item"
          :class="{ 'td-menu-item--active': activeKeyFlyOut === menuKey }" @click="openFlyout(menuKey, $event)"
          @mouseleave="scheduleCloseFlyout()">
          <span>{{ $t(`i18nCommon.${menuKey}.title`) }}</span>
        </div>
      </div>
    </div>

    <div class="td-header-right">
      <div class="td-header-toast">
        <div v-if="currentHeaderToast" :class="[
          'td-header-toast-item',
          `td-header-toast--${currentHeaderToast.type}`,
        ]" @click="removeHeaderToast(currentHeaderToast.id)">
          {{ currentHeaderToast.message }}
        </div>
      </div>
    </div>

    <!-- Flyout Menu: mở xuống dưới (placement="bottom") -->
    <TDFlyoutPanel :show="!!activeKeyFlyOut && activeKeyFlyOut !== 'logo'" :anchorElFlyout="anchorElFlyout"
      placement="bottom" panelClass="td-header-flyout" @mouseenter="cancelCloseFlyOut" @mouseleave="onFlyoutPanelLeave">
      <template v-if="activeKeyFlyOut === 'theme'">
        <div class="td-theme-category-list">
          <div class="td-flyout-item td-theme-category-item"
            :class="{ 'td-theme-category-item--active': activeSubKey === 'theme' }"
            @mouseenter="openSub('theme', $event)" @click="openSub('theme', $event)">
            {{ $t("i18nCommon.tdheader.themes") }}
          </div>
          <div class="td-flyout-item td-theme-category-item"
            :class="{ 'td-theme-category-item--active': activeSubKey === 'backgroundEffect' }"
            @mouseenter="openSub('backgroundEffect', $event)" @click="openSub('backgroundEffect', $event)">
            {{ $t("i18nCommon.tdheader.backgroundEffects") }}
          </div>
          <div class="td-flyout-item td-theme-category-item"
            :class="{ 'td-theme-category-item--active': activeSubKey === 'cursorEffect' }"
            @mouseenter="openSub('cursorEffect', $event)" @click="openSub('cursorEffect', $event)">
            {{ $t("i18nCommon.tdheader.cursorEffects") }}
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="item in currentMenuItems" :key="item.key" class="td-flyout-item" v-tooltip="item.tooltip"
          @click="item.action">
          {{ $t(item.labelKey) }}
        </div>
      </template>
    </TDFlyoutPanel>

    <!-- Sub Flyout: danh sách con của menu nhiều category -->
    <TDFlyoutPanel v-if="activeKeyFlyOut === 'theme'" :show="!!activeSubKey" :anchorElFlyout="subAnchorEl"
      placement="right" panelClass="td-theme-sub-flyout" @mouseenter="cancelCloseFlyOut" @mouseleave="closeSub">
      <template v-if="activeSubKey === 'theme'">
        <div class="td-flyout-theme-list" v-tooltip="$t('i18nCommon.tdheader.themeTooltip')">
          <div v-for="item in themeItems" :key="item.value" class="td-flyout-item td-flyout-theme-item"
            @mouseenter="debouncedPreviewTheme(item.value)" @mouseleave="onThemeItemLeave"
            @click="applyTheme(item.value)">
            {{ item.label }}
          </div>
        </div>
      </template>
      <template v-else-if="activeSubKey === 'backgroundEffect'">
        <div class="td-flyout-theme-list" v-tooltip="$t('i18nCommon.tdheader.backgroundEffectTooltip')">
          <div v-for="item in backgroundEffectItems" :key="item.value" class="td-flyout-item td-flyout-theme-item"
            @click="applyBackgroundEffect(item.value)">
            {{ item.label }}
          </div>
        </div>
      </template>
      <template v-else-if="activeSubKey === 'cursorEffect'">
        <div class="td-flyout-theme-list" v-tooltip="$t('i18nCommon.tdheader.cursorEffectTooltip')">
          <div v-for="item in cursorEffectItems" :key="item.value" class="td-flyout-item td-flyout-theme-item"
            @click="applyCursorEffect(item.value)">
            {{ item.label }}
          </div>
        </div>
      </template>
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
import TDCommonFunction from "@/common/TDCommonFunction.js";

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
      savedTheme: null,
      themeItems: this.$tdEnum.monacoThemeList,
      savedBackgroundEffect: null,
      savedCursorEffect: null,
      activeSubKey: null,
      subAnchorEl: null,
    };
  },
  computed: {
    appName() {
      return window.__env.appName;
    },
    currentMenuItems() {
      return this.menuConfig[this.activeKeyFlyOut] ?? [];
    },
    backgroundEffectItems() {
      return this.$tdEnum.backgroundEffectList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
    cursorEffectItems() {
      return this.$tdEnum.cursorEffectList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
  },
  watch: {
    activeKeyFlyOut(newVal, oldVal) {
      if (oldVal === "theme" && newVal !== "theme") {
        this.revertTheme();
      }
      // Reset sub-flyout cho bất kỳ menu nào khi mở/re-mở để không dính
      // anchor/state cũ (tránh lệch vị trí khi menu có nhiều category)
      this.activeSubKey = null;
      this.subAnchorEl = null;
    },
  },
  mounted() {
    this.debouncedPreviewTheme = TDCommonFunction.debounce(this.previewTheme, 300);
    this.headerToastUnsubscribe = eventBus.on(
      TDEnumEventBus.headerToastShow,
      this.onHeaderToastShow,
    );
    this.loadCurrentTheme();
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
      theme: [
        // chỗ này sẽ được build động sau
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
    if (this.debouncedPreviewTheme?.cancel) {
      this.debouncedPreviewTheme.cancel();
    }
    if (this.headerToastUnsubscribe) {
      this.headerToastUnsubscribe();
    }
  },
  methods: {
    async loadCurrentTheme() {
      this.savedTheme = await this.$tdUtility.getUserSettings("theme");
      this.savedBackgroundEffect =
        (await this.$tdUtility.getUserSettings("backgroundEffect")) ?? "shuffle";
      this.savedCursorEffect =
        (await this.$tdUtility.getUserSettings("cursorEffect")) ?? "off";
    },
    previewTheme(themeName) {
      this.$tdUtility.setTheme(themeName);
      eventBus.emit(TDEnumEventBus.themeChanged, themeName);
    },
    revertTheme() {
      if (this.savedTheme) {
        this.$tdUtility.setTheme(this.savedTheme);
        eventBus.emit(TDEnumEventBus.themeChanged, this.savedTheme);
      }
    },
    onThemeItemLeave() {
      if (this.debouncedPreviewTheme?.cancel) {
        this.debouncedPreviewTheme.cancel();
      }
      this.revertTheme();
    },
    async applyTheme(themeName) {
      this.savedTheme = themeName;
      this.$tdUtility.setTheme(themeName);
      eventBus.emit(TDEnumEventBus.themeChanged, themeName);
      await this.$tdUtility.saveUserSettings("theme", themeName);
      this.closeFlyout();
    },
    async applyBackgroundEffect(effectValue) {
      this.savedBackgroundEffect = effectValue;
      await this.$tdUtility.saveUserSettings("backgroundEffect", effectValue);
      // Áp dụng tức thì cho mọi background effect đang mount
      eventBus.emit(TDEnumEventBus.backgroundEffectChanged, effectValue);
      this.closeFlyout();
    },
    async applyCursorEffect(effectValue) {
      this.savedCursorEffect = effectValue;
      await this.$tdUtility.saveUserSettings("cursorEffect", effectValue);
      // Áp dụng tức thì cho hiệu ứng chuột đang mount
      eventBus.emit(TDEnumEventBus.cursorEffectChanged, effectValue);
      this.closeFlyout();
    },
    openSub(type, event) {
      this.subAnchorEl = event?.currentTarget ?? this.subAnchorEl;
      this.activeSubKey = type;
      this.cancelCloseFlyOut();
    },
    closeSub() {
      this.activeSubKey = null;
      this.revertTheme();
      this.subAnchorEl = null;
    },
    onFlyoutPanelLeave() {
      if (this.debouncedPreviewTheme?.cancel) {
        this.debouncedPreviewTheme.cancel();
      }
      this.revertTheme();
      this.scheduleCloseFlyout();
    },
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

.td-theme-category-list {
  min-width: 180px;
}

.td-theme-category-item {
  &.td-theme-category-item--active {
    background-color: var(--focus-color);
  }
}

.td-flyout-theme-list {
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  min-width: 180px;
}

.td-flyout-theme-item {
  padding-left: 12px;
}
</style>
