<template>
  <div class="flex tm-header-container" v-click-outside="closeFlyout">
    <div class="tm-app-name">
      <div class="tm-app-brand" @click="reloadAppFunc">
        <div class="tm-logo tm-logo-tool-app"></div>
        <div class="tm-app-title">
          {{ appName }}
        </div>
      </div>
      <div class="tm-header-menu">
        <div
          v-for="(items, menuKey) in menuConfig"
          :key="menuKey"
          class="tm-menu-item"
          :class="{ 'tm-menu-item--active': activeKeyFlyOut === menuKey }"
          @click="openFlyout(menuKey, $event)"
          @mouseleave="scheduleCloseFlyout()"
        >
          <span>{{ $t(`i18nCommon.${menuKey}.title`) }}</span>
        </div>
      </div>
    </div>

    <div class="tm-header-right">
      <span class="tm-header-version">{{ appVersion }}</span>
    </div>

    <!-- Flyout Menu: mở xuống dưới (placement="bottom") -->
    <TMFlyoutPanel
      :show="!!activeKeyFlyOut && activeKeyFlyOut !== 'logo'"
      :anchorElFlyout="anchorElFlyout"
      placement="bottom"
      panelClass="tm-header-flyout"
      @mouseenter="cancelCloseFlyOut"
      @mouseleave="onFlyoutPanelLeave"
    >
      <div
        v-for="item in currentMenuItems"
        :key="item.key"
        class="tm-flyout-item"
        :class="{
          'tm-flyout-item--active': item.children
            ? activeSubKey === item.key
            : false,
        }"
        v-tooltip="item.tooltip"
        @mouseenter="onMenuItemEnter(item, $event)"
        @click="onMenuItemClick(item, $event)"
      >
        {{ $t(item.labelKey) }}
      </div>
    </TMFlyoutPanel>

    <!-- Sub Flyout: menu con của item có children (panel luôn mount, chỉ ẩn/hiện) -->
    <TMFlyoutPanel
      :show="!!activeSubItem"
      :anchorElFlyout="subAnchorEl"
      placement="right"
      panelClass="tm-theme-sub-flyout"
      @mouseenter="cancelCloseFlyOut"
      @mouseleave="closeSub"
    >
      <template v-if="activeSubItem">
        <div
          class="tm-flyout-theme-list"
          v-tooltip="$t(activeSubItem.tooltipKey)"
        >
          <div
            v-for="row in subMenuFlyoutRows"
            :key="row.child.value"
            class="tm-flyout-item tm-flyout-theme-item"
            @mouseenter="onSubItemEnter(row.item, row.child)"
            @mouseleave="onSubItemLeave(row.item)"
            @click="onSubItemClick(row.item, row.child)"
          >
            {{ row.child.label }}
          </div>
        </div>
      </template>
    </TMFlyoutPanel>
  </div>
</template>

<script>
import { useTabManager } from "@/stores/TMTabManager.js";
import TMAgentAPI from "@/common/api/request/AgentAPI/TMAgentAPI.js";
import TMFlyoutPanel from "@/components/TMFlyoutPanel.vue";
import { useFlyout } from "@/common/plugin/TMUseFlyout.js";
import eventBus from "@/common/event/TMEventBus.js";
import { TMEnumEventBus } from "@/common/event/TMEnumEventBus.js";
import TMDialogUtil, { TMDialogEnum } from "@/common/TMDialogUtil.js";
import TMCommonFunction from "@/common/TMCommonFunction.js";
import TMTipsMixin from "@/mixins/TMTipsMixin.js";

export default {
  name: "TMHeaderApp",
  components: { TMFlyoutPanel },
  mixins: [TMTipsMixin],
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
      themeItems: this.$tmEnum.monacoThemeList,
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
    appVersion() {
      return `v${this.$tmUtility.getAppVersion()}`;
    },
    menuConfig() {
      return {
        view: [
          {
            key: "showAllShortcut",
            labelKey: "i18nCommon.tmheader.showAllShortcut",
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
            labelKey: "i18nCommon.tmheader.themes",
            tooltipKey: "i18nCommon.tmheader.themeTooltip",
            children: this.themeItems,
            onChildHover: (value) => this.debouncedPreviewTheme?.(value),
            onChildLeave: () => this.onThemeItemLeave(),
            onChildClick: (value) => this.applyTheme(value),
          },
          {
            key: "backgroundEffect",
            labelKey: "i18nCommon.tmheader.backgroundEffects",
            tooltipKey: "i18nCommon.tmheader.backgroundEffectTooltip",
            children: this.backgroundEffectItems,
            onChildClick: (value) => this.applyBackgroundEffect(value),
          },
          {
            key: "cursorEffect",
            labelKey: "i18nCommon.tmheader.cursorEffects",
            tooltipKey: "i18nCommon.tmheader.cursorEffectTooltip",
            children: this.cursorEffectItems,
            onChildClick: (value) => this.applyCursorEffect(value),
          },
          {
            key: "welcomeBackground",
            labelKey: "i18nCommon.tmheader.welcomeBackgrounds",
            tooltipKey: "i18nCommon.tmheader.welcomeBackgroundTooltip",
            children: this.welcomeBackgroundItems,
            onChildClick: (value) => this.applyWelcomeBackground(value),
          },
          {
            key: "zenMode",
            labelKey: "i18nCommon.tmheader.zenMode",
            action: this.toggleZenMode,
          },
        ],
        help: [
          {
            key: "agent",
            labelKey: "i18nCommon.tmheader.helpAgent",
            tooltipKey: "i18nCommon.tmheader.helpAgentTooltip",
            children: this.helpAgentItems,
            onChildClick: (value) => this.onHelpItemClick(value),
          },
          {
            key: "app",
            labelKey: "i18nCommon.tmheader.helpApp",
            tooltipKey: "i18nCommon.tmheader.helpAppTooltip",
            children: this.helpAppItems,
            onChildClick: (value) => this.onHelpItemClick(value),
          },
          {
            key: "docs",
            labelKey: "i18nCommon.tmheader.helpDocs",
            tooltipKey: "i18nCommon.tmheader.helpDocsTooltip",
            children: this.helpDocsItems,
            onChildClick: (value) => this.onHelpItemClick(value),
          },
        ],
      };
    },
    currentMenuItems() {
      return this.menuConfig[this.activeKeyFlyOut] ?? [];
    },
    /**
     * Menu trợ giúp tách thành 3 nhóm con, mỗi nhóm mở 1 sub-flyout
     * (giống hệt cách menu Giao diện chia nhóm chủ đề / hiệu ứng)
     */
    helpAgentItems() {
      return [
        {
          label: this.$t("i18nCommon.feature.agentDownload.title"),
          value: "downloadAgent",
        },
        {
          label: this.$t("i18nCommon.apiTesting.pingAgent"),
          value: "pingAgent",
        },
      ];
    },
    helpAppItems() {
      return [
        {
          label: this.$t("i18nCommon.feature.userSettings"),
          value: "userSettings",
        },
        {
          label: this.$t("i18nCommon.help.reloadApp"),
          value: "reloadApp",
        },
      ];
    },
    helpDocsItems() {
      return [
        // Màn welcome chỉ hiện khi chưa mở tab nào, nên đặt thêm ở menu trợ giúp
        // để xem toàn bộ tip được dù khi đang mở tool
        {
          label: this.$t("i18nTip.viewAllTips"),
          value: "showAllTips",
        },
        // Điều khoản vốn chỉ hiện 1 lần lúc khởi chạy, đặt thêm ở đây để
        // xem lại được bất cứ lúc nào
        {
          label: this.$t("i18nCommon.agreementTitle"),
          value: "showAgreement",
        },
        {
          label: this.$t("i18nCommon.tmheader.goToSource"),
          value: "goToSource",
        },
      ];
    },
    /**
     * Bảng tra value của item trong sub-menu trợ giúp → hàm xử lý tương ứng,
     * để các nhóm con chỉ cần khai báo value là chạy, không lặp lại hàm.
     */
    helpItemActions() {
      return {
        downloadAgent: this.downloadAgentFunc,
        pingAgent: this.pingAgentFunc,
        userSettings: this.userSettingsFunc,
        reloadApp: this.reloadAppFunc,
        goToSource: this.goToSourceFunc,
        showAllTips: this.showAllTipsPopup,
        showAgreement: this.showAgreementPopup,
      };
    },
    backgroundEffectItems() {
      return this.$tmEnum.backgroundEffectList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
    cursorEffectItems() {
      return this.$tmEnum.cursorEffectList.map((item) => ({
        label: this.$t(item.labelKey),
        value: item.value,
      }));
    },
    welcomeBackgroundItems() {
      return this.$tmEnum.welcomeBackgroundList.map((item) => ({
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
    this.debouncedPreviewTheme = TMCommonFunction.debounce(
      this.previewTheme,
      300,
    );
    this.loadCurrentTheme();
    this.logoItems = [
      {
        key: "tool",
        logoClass: "tm-logo-tool-app",
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
      this.savedTheme = await this.$tmUtility.getUserSettings("theme");
      this.savedBackgroundEffect =
        (await this.$tmUtility.getUserSettings("backgroundEffect")) ?? "off";
      this.savedCursorEffect =
        (await this.$tmUtility.getUserSettings("cursorEffect")) ?? "off";
    },
    previewTheme(themeName) {
      this.$tmUtility.setTheme(themeName);
      eventBus.emit(TMEnumEventBus.themeChanged, themeName);
    },
    revertTheme() {
      if (this.savedTheme) {
        this.$tmUtility.setTheme(this.savedTheme);
        eventBus.emit(TMEnumEventBus.themeChanged, this.savedTheme);
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
      this.$tmUtility.setTheme(themeName);
      eventBus.emit(TMEnumEventBus.themeChanged, themeName);
      await this.$tmUtility.saveUserSettings("theme", themeName);
      this.closeFlyout();
    },
    async applyBackgroundEffect(effectValue) {
      this.savedBackgroundEffect = effectValue;
      await this.$tmUtility.saveUserSettings("backgroundEffect", effectValue);
      // Áp dụng tức thì cho mọi background effect đang mount
      eventBus.emit(TMEnumEventBus.backgroundEffectChanged, effectValue);
      this.closeFlyout();
    },
    async applyCursorEffect(effectValue) {
      this.savedCursorEffect = effectValue;
      await this.$tmUtility.saveUserSettings("cursorEffect", effectValue);
      // Áp dụng tức thì cho hiệu ứng chuột đang mount
      eventBus.emit(TMEnumEventBus.cursorEffectChanged, effectValue);
      this.closeFlyout();
    },
    /**
     * Hình nền màn welcome: áp dụng tức thì cho màn welcome đang mở, không
     * cần khởi động lại app
     */
    async applyWelcomeBackground(backgroundValue) {
      await this.$tmUtility.saveUserSettings(
        "welcomeBackground",
        backgroundValue,
      );
      eventBus.emit(TMEnumEventBus.welcomeBackgroundChanged, backgroundValue);
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
    /** Chạy action của 1 item trong sub-menu của nhóm trợ giúp */
    onHelpItemClick(value) {
      const action = this.helpItemActions[value];
      if (typeof action === "function") {
        action();
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
      me.$tmUtility.copyToClipboard(me.$tmUtility.newGuid());
      this.closeFlyout();
    },
    getCurrentDateFunc() {
      const now = new Date();
      const formatted = now.toISOString().split("T")[0];
      this.$tmUtility.copyToClipboard(formatted);
      this.closeFlyout();
    },
    getCurrentDateTimeFunc() {
      const now = new Date();
      const formatted = now.toISOString().slice(0, 19).replace("T", " ");
      this.$tmUtility.copyToClipboard(formatted);
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
        path: "/TMUserSettings",
        component: () => import("@/views/misc/TMUserSettings.vue"),
      });
      this.closeFlyout();
    },
    appDataMinerFunc() {
      this.openTab({
        titleKey: "i18nCommon.feature.AppDataMiner",
        groupPath: "api",
        path: "/appdataminer",
        component: () => import("@/views/tools/TMAppDataMiner.vue"),
      });
      this.closeFlyout();
    },
    goToSourceFunc() {
      this.$tmUtility.goToSource();
      this.closeFlyout();
    },
    downloadAgentFunc() {
      const url = window.__env?.githubSource?.releasesUrl;
      window.open(url, "_blank");
      this.closeFlyout();
    },
    async pingAgentFunc() {
      let me = this;
      try {
        let res = await new TMAgentAPI().heathCheck();
        if (res?.success) {
          me.$tmToast.success(me.buildPingAgentMessage(res.data), 5000);
        } else {
          me.$tmToast.error(me.$t("i18nCommon.tmheader.pingAgentFailed"), 5000);
        }
      } catch {
        me.$tmUtility.showErrorNotFoundAgentServer();
      }
      this.closeFlyout();
    },
    /**
     * Ghép nội dung hiển thị sau khi ping server: trạng thái + version UI + version BE
     * BE cũ chỉ trả về text thuần thì chỉ hiện text đó, không có version để hiện
     */
    buildPingAgentMessage(healthData) {
      let me = this;
      if (typeof healthData == "string") {
        return healthData || me.$t("i18nCommon.tmheader.pingAgentSuccess");
      }
      let parts = [];
      if (healthData?.message) {
        parts.push(healthData.message);
      }
      // version UI lấy từ bản thân app, version BE do API trả về
      let uiVersion = me.$tmUtility.getAppVersion();
      let beVersion = healthData?.beVersion;
      if (uiVersion) {
        parts.push(`${me.$t("i18nCommon.tmheader.uiVersion")}: ${uiVersion}`);
      }
      if (beVersion) {
        parts.push(
          `${me.$t("i18nCommon.tmheader.serverVersion")}: ${beVersion}`,
        );
      }
      return parts.length > 0
        ? parts.join(" · ")
        : me.$t("i18nCommon.tmheader.pingAgentSuccess");
    },
    toggleZenMode() {
      eventBus.emit(TMEnumEventBus.zenModeToggle);
      this.closeFlyout();
    },
    showAllShortcutPopup() {
      TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMShowAllShortcutPopup,
        ownerForm: this,
        props: {},
      });
      this.closeFlyout();
    },
    showAllTipsPopup() {
      this.showAllTips();
      this.closeFlyout();
    },
    /**
     * Xem lại điều khoản sử dụng. Popup này vốn do App.vue gọi lúc khởi chạy,
     * ở đây mở lại thủ công nên vẫn lưu cờ đã đồng ý khi bấm nút đồng ý để
     * lần sau app không hỏi lại nữa
     */
    showAgreementPopup() {
      let me = this;
      let cacheKey = me.$tmEnum.cacheConfig.AgreementAccepted;
      TMDialogUtil.showPopup({
        dialogType: TMDialogEnum.TMAgreementPopup,
        ownerForm: me,
        props: {},
        param: {},
        callback: () => me.$tmCache.set(cacheKey, true),
      });
      this.closeFlyout();
    },
    reloadAppFunc() {
      this.$tmUtility.reloadApp();
      this.closeFlyout();
    },
  },
};
</script>

<style lang="scss" scoped>
.tm-header-container {
  width: 100%;
  height: 100%;
  background-color: var(--bg-main-color);
  justify-content: space-between;
  padding: var(--padding) calc(var(--padding) * 1.5);

  .tm-app-name {
    display: flex;
    align-items: center;
    gap: var(--padding);

    .tm-app-brand {
      display: flex;
      align-items: center;
      gap: var(--padding);
      cursor: pointer;
    }

    .tm-app-title {
      font-size: 14px;
      font-weight: 700;
    }
  }

  .tm-header-menu {
    display: flex;
    align-items: center;
    gap: var(--padding);
  }

  .tm-header-right {
    display: flex;
    align-items: center;
    gap: var(--padding);
    margin-left: auto;
  }

  .tm-header-version {
    font-size: var(--font-size-medium-rare);
    white-space: nowrap;
  }
}

.tm-flyout-theme-list {
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  min-width: 180px;
}

.tm-flyout-theme-item {
  padding-left: 12px;
}
</style>
