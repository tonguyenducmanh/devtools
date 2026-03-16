<template>
  <div class="td-footer-app">
    <div class="td-footer-shortcuts">
      <div
        v-for="shortcut in activeShortcuts"
        :key="shortcut.key"
        class="td-shortcut-item"
        @click="shortcut.action"
      >
        <span class="td-shortcut-keys">
          <span v-if="shortcut.requireCtrl" class="td-shortcut-key">Ctrl</span>
          <span class="td-shortcut-key">{{ shortcut.key.toUpperCase() }}</span>
        </span>
        <span class="td-shortcut-label">{{ $t(shortcut.labelKey) }}</span>
      </div>
    </div>
    <div class="td-footer-actions">
      <div
        class="td-setting-item"
        @click="goToUserSetting"
      >
        <div class="td-icon td-setting-icon"></div>
        <span class="td-setting-label">{{ $t('i18nCommon.feature.userSettings') }}</span>
      </div>
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
      activeShortcuts: [],
    };
  },
  mounted() {
    this.updateActiveShortcuts();
  },
  methods: {
    updateActiveShortcuts() {
      const componentShortcuts = TDShortcutAction.getActiveShortcuts().map(s => ({
        key: s.key,
        labelKey: s.labelKey,
        tooltipKey: s.tooltipKey,
        requireCtrl: s.requireCtrl,
        action: s.action,
      }));
      this.activeShortcuts = [...componentShortcuts];
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

.td-setting-item {
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

.td-setting-label {
  font-size: var(--font-size-medium-rare);
  color: var(--text-secondary-color);
}

.td-setting-icon {
  opacity: 0.7;
  transition: opacity 0.2s ease;

  .td-setting-item:hover & {
    opacity: 1;
  }
}
</style>