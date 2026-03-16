<template>
  <div class="td-footer-app">
    <div class="td-footer-shortcuts">
      <div
        v-for="shortcut in activeShortcuts"
        :key="shortcut.key"
        class="td-shortcut-item"
        @click="shortcut.action"
        v-tooltip="$t(shortcut.tooltipKey)"
      >
        <span class="td-shortcut-keys">
          <span class="td-shortcut-key">Ctrl</span>
          <span class="td-shortcut-key">{{ shortcut.key.toUpperCase() }}</span>
        </span>
        <span class="td-shortcut-label">{{ $t(shortcut.labelKey) }}</span>
      </div>
    </div>
    <div class="td-footer-actions">
      <div
        class="td-icon td-setting-icon"
        @click="goToUserSetting"
        v-tooltip="$t('i18nCommon.feature.userSettings')"
      ></div>
    </div>
  </div>
</template>

<script>
import { useTabManager } from "@/stores/TDTabManager.js";
import TDShortcutAction from "@/common/TDShortcutAction.js";
import TDDialogUtil, { TDDialogEnum } from "@/common/TDDialogUtil.js";

export default {
  name: "TDFooterApp",
  setup() {
    const { openTab } = useTabManager();
    return { openTab };
  },
  data() {
    return {
      globalShortcuts: [
        {
          key: "p",
          labelKey: "i18nCommon.footer.search",
          tooltipKey: "i18nCommon.footer.searchTooltip",
          action: this.openSearchPopup,
        },
      ],
      activeShortcuts: [],
    };
  },
  mounted() {
    window.addEventListener("keydown", this.handleGlobalKeydown, true);
    this.updateActiveShortcuts();
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.handleGlobalKeydown, true);
  },
  methods: {
    openSearchPopup() {
      TDDialogUtil.showPopup({
        dialogType: TDDialogEnum.TDGoToToolPopup,
        ownerForm: this,
      });
    },
    handleGlobalKeydown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "p") {
        event.preventDefault();
        this.openSearchPopup();
      }
    },
    updateActiveShortcuts() {
      const componentShortcuts = TDShortcutAction.getActiveShortcuts().map(s => ({
        key: s.key,
        labelKey: s.labelKey,
        tooltipKey: s.tooltipKey,
        action: s.action,
      }));
      this.activeShortcuts = [...this.globalShortcuts, ...componentShortcuts];
    },
    goToUserSetting() {
      let me = this;
      me.openTab({
        titleKey: "i18nCommon.feature.userSettings",
        groupPath: "",
        path: "/TDUserSettings",
        component: () => import("@/views/misc/TDUserSettings.vue"),
      });
    },
  },
  created() {
    TDShortcutAction.onChange(() => {
      this.updateActiveShortcuts();
    });
  },
};
</script>

<style lang="scss" scoped>
.td-footer-app {
  width: 100%;
  height: 32px;
  background-color: var(--bg-main-color);
  border-top: 1px solid var(--bg-layer-color);
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  flex-shrink: 0;
}

.td-footer-shortcuts {
  display: flex;
  align-items: center;
  gap: var(--padding);
}

.td-shortcut-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--bg-layer-color);
  }
}

.td-shortcut-keys {
  display: flex;
  align-items: center;
  gap: 2px;
}

.td-shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 2px 6px;
  background-color: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.td-shortcut-label {
  font-size: var(--font-size-medium-rare);
  color: var(--text-secondary-color);
}

.td-footer-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.td-setting-icon {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}
</style>