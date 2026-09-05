<template>
  <div class="flex td-header-container" v-click-outside="closeFlyout">
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
    </div>

    <!-- Flyout Menu: mở xuống dưới (placement="bottom") -->
    <TDFlyoutPanel :show="!!activeKeyFlyOut && activeKeyFlyOut !== 'logo'" :anchorElFlyout="anchorElFlyout"
      placement="bottom" panelClass="td-header-flyout" @mouseenter="cancelCloseFlyOut" @mouseleave="onFlyoutPanelLeave">
      <div v-for="item in currentMenuItems" :key="item.key" class="td-flyout-item"
        :class="{ 'td-flyout-item--active': item.children ? activeSubKey === item.key : false }"
        v-tooltip="item.tooltip" @mouseenter="onMenuItemEnter(item, $event)" @click="onMenuItemClick(item, $event)">
        {{ $t(item.labelKey) }}
      </div>
    </TDFlyoutPanel>

    <!-- Sub Flyout: menu con của item có children (panel luôn mount, chỉ ẩn/hiện) -->
    <TDFlyoutPanel :show="!!activeSubItem" :anchorElFlyout="subAnchorEl" placement="right"
      panelClass="td-theme-sub-flyout" @mouseenter="cancelCloseFlyOut" @mouseleave="closeSub">
      <template v-if="activeSubItem">
        <div class="td-flyout-theme-list" v-tooltip="$t(activeSubItem.tooltipKey)">
          <div v-for="row in subMenuFlyoutRows" :key="row.child.value" class="td-flyout-item td-flyout-theme-item"
            @mouseenter="onSubItemEnter(row.item, row.child)" @mouseleave="onSubItemLeave(row.item)"
            @click="onSubItemClick(row.item, row.child)">
            {{ row.child.label }}
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
      logoItems: [],
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
    menuConfig() {
      return {
        view: [
          {
            key: "showAllShortcut",
            labelKey: "i18nCommon.tdheader.showAllShortcut",
            action: this.showAllShortcutPopup,
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
        appearance: [
          {
            key: "theme",
            labelKey: "i18nCommon.tdheader.themes",
            tooltipKey: "i18nCommon.tdheader.themeTooltip",
            children: this.themeItems,
            onChildHover: (value) => this.debouncedPreviewTheme?.(value),
            onChildLeave: () => this.onThemeItemLeave(),
            onChildClick: (value) => this.applyTheme(value),
          },
          {
            key: "backgroundEffect",
            labelKey: "i18nCommon.tdheader.backgroundEffects",
            tooltipKey: "i18nCommon.tdheader.backgroundEffectTooltip",
            children: this.backgroundEffectItems,
            onChildClick: (value) => this.applyBackgroundEffect(value),
          },
          {
            key: "cursorEffect",
            labelKey: "i18nCommon.tdheader.cursorEffects",
            tooltipKey: "i18nCommon.tdheader.cursorEffectTooltip",
            children: this.cursorEffectItems,
            onChildClick: (value) => this.applyCursorEffect(value),
          },
          {
            key: "zenMode",
            labelKey: "i18nCommon.tdheader.zenMode",
            action: this.toggleZenMode,
          },
        ],
        help: [
          {
            key: "userSettings",
            labelKey: "i18nCommon.feature.userSettings",
            action: this.userSettingsFunc,
          },
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
    activeSubItem() {
      return (
        this.currentMenuItems.find((item) => item.key === this.activeSubKey) ||
        null
      );
    },
    // Chụp item tại thời điểm render. Nếu dùng activeSubItem trực tiếp trong
    // handler click, click-outside có thể đóng flyout trước khi handler chạy
    // làm activeSubItem thành null và gây lỗi (vd: cannot read onChildClick).
    subMenuFlyoutRows() {
      const item = this.activeSubItem;
      return (item?.children ?? []).map((child) => ({ item, child }));
    },
  },
  watch: {
    activeKeyFlyOut(newVal, oldVal) {
      if (oldVal === "appearance" && newVal !== "appearance") {
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
    this.loadCurrentTheme();
    this.logoItems = [
      {
        key: "tool",
        logoClass: "td-logo-tool-app",
        label: window.__env?.appName ?? "Tools",
        action: () => this.openOtherApp(window.location.href),
      },
    ];
  },
  beforeUnmount() {
    if (this.debouncedPreviewTheme?.cancel) {
      this.debouncedPreviewTheme.cancel();
    }
  },
  methods: {
    async loadCurrentTheme() {
      this.savedTheme = await this.$tdUtility.getUserSettings("theme");
      this.savedBackgroundEffect =
        (await this.$tdUtility.getUserSettings("backgroundEffect")) ?? "off";
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
    onMenuItemEnter(item, event) {
      if (item.children) {
        this.openSub(item.key, event);
      } else {
        this.closeSub();
      }
    },
    onMenuItemClick(item, event) {
      if (item.children) {
        this.openSub(item.key, event ?? {});
      } else if (item.action) {
        item.action();
      }
    },
    onSubItemEnter(item, child) {
      if (item?.onChildHover) {
        item.onChildHover(child.value);
      }
    },
    onSubItemLeave(item) {
      if (item?.onChildLeave) {
        item.onChildLeave();
      }
    },
    onSubItemClick(item, child) {
      if (item?.onChildClick) {
        item.onChildClick(child.value);
      }
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
