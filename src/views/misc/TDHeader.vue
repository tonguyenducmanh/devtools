<template>
  <div class="flex td-header-container">
    <div class="td-app-name">
      <div class="td-logo" @click="goToWelcome"></div>
      <div
        class="td-app-title"
        @click="goToWelcome"
        v-tooltip="$t('i18nCommon.feature.welcome')"
      >
        {{ appName }}
      </div>
      <div class="td-header-menu">
        <div
          class="td-menu-item"
          @mouseenter="onSettingsMouseEnter"
          @mouseleave="onSettingsMouseLeave"
        >
          <span>{{ $t('i18nCommon.settings.title') }}</span>
        </div>
        <div
          class="td-menu-item"
          @mouseenter="onHelpMouseEnter"
          @mouseleave="onHelpMouseLeave"
        >
          <span>{{ $t('i18nCommon.help.title') }}</span>
        </div>
      </div>
    </div>

    <!-- Flyout Menu -->
    <Teleport to="body">
      <Transition name="td-flyout">
        <div
          v-if="hoveredMenu"
          class="td-header-flyout"
          :style="flyoutStyle"
          @mouseenter="onFlyoutMouseEnter"
          @mouseleave="onFlyoutMouseLeave"
        >
          <template v-if="hoveredMenu === 'help'">
            <div
              class="td-flyout-item"
              @click="onGoToSource"
            >
              {{ $t('i18nCommon.tdheader.goToSource') }}
            </div>
            <div
              class="td-flyout-item"
              @click="onDownloadAgent"
            >
              {{ $t('i18nCommon.feature.agentDownload.title') }}
            </div>
            <div
              class="td-flyout-item"
              @click="onPingAgent"
            >
              {{ $t('i18nCommon.ping') }}
            </div>
            <div
              class="td-flyout-item"
              @click="onReloadApp"
            >
              {{ $t('i18nCommon.help.reloadApp') }}
            </div>
          </template>
          <template v-else-if="hoveredMenu === 'settings'">
            <div
              class="td-flyout-item"
              @click="goToUserSettings"
            >
              {{ $t('i18nCommon.feature.userSettings') }}
            </div>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { useTabManager } from "@/stores/TDTabManager.js";
import TDAgentAPI from "@/common/api/request/AgentAPI/TDAgentAPI.js";

export default {
  name: "TDHeader",
  setup() {
    const { openTab, exitTabMode } = useTabManager();
    return { openTab, exitTabMode };
  },
  data() {
    return {
      hoveredMenu: null,
      flyoutStyle: {},
      _leaveTimer: null,
    };
  },
  computed: {
    appName() {
      return window.__env.appName;
    },
  },
  methods: {
    goToWelcome() {
      this.exitTabMode();
    },
    goToUserSettings() {
      this.openTab({
        titleKey: "i18nCommon.feature.userSettings",
        groupPath: "",
        path: "/TDUserSettings",
        component: () => import("@/views/misc/TDUserSettings.vue"),
      });
      this.hoveredMenu = null;
    },
    onGoToSource() {
      this.$tdUtility.goToSource();
      this.hoveredMenu = null;
    },
    onDownloadAgent() {
      const url = window.__env?.githubSource?.releasesUrl;
      window.open(url, "_blank");
      this.hoveredMenu = null;
    },
    async onPingAgent() {
      try {
        let res = await new TDAgentAPI().heathCheck();
        if (res && res.success && res.data) {
          this.$tdToast.success(res.data);
        } else {
          this.$tdToast.success(res);
        }
      } catch (ex) {
        this.$tdUtility.showErrorNotFoundAgentServer();
      }
      this.hoveredMenu = null;
    },
    onReloadApp() {
      this.$tdUtility.reloadApp();
      this.hoveredMenu = null;
    },
    showFlyout(menu, event) {
      clearTimeout(this._leaveTimer);
      const rect = event.currentTarget.getBoundingClientRect();
      this.flyoutStyle = {
        position: "fixed",
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        zIndex: 1000,
      };
      this.hoveredMenu = menu;
    },
    onHelpMouseEnter(event) {
      this.showFlyout("help", event);
    },
    onHelpMouseLeave() {
      this._leaveTimer = setTimeout(() => {
        this.hoveredMenu = null;
      }, 120);
    },
    onSettingsMouseEnter(event) {
      this.showFlyout("settings", event);
    },
    onSettingsMouseLeave() {
      this._leaveTimer = setTimeout(() => {
        this.hoveredMenu = null;
      }, 120);
    },
    onFlyoutMouseEnter() {
      clearTimeout(this._leaveTimer);
    },
    onFlyoutMouseLeave() {
      this._leaveTimer = setTimeout(() => {
        this.hoveredMenu = null;
      }, 120);
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
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-medium-rare);
    color: var(--text-color);
    transition: background-color 0.15s ease;

    &:hover {
      background-color: var(--bg-layer-color);
    }
  }
}
</style>

<style lang="scss">
.td-flyout-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.td-flyout-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.td-flyout-enter-from,
.td-flyout-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.td-header-flyout {
  background-color: var(--bg-main-color);
  border: 1px solid var(--bg-layer-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  padding: 4px;
  min-width: 160px;
}

.td-flyout-item {
  display: block;
  padding: 8px 12px;
  font-size: var(--font-size-medium-rare);
  color: var(--text-color);
  white-space: nowrap;
  cursor: pointer;
  border-radius: var(--border-radius);

  &:hover {
    background-color: var(--bg-layer-color);
  }
}
</style>