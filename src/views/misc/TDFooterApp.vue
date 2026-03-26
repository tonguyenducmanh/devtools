<template>
  <div class="td-footer-app">
    <div class="td-footer-shortcuts">
      <TransitionGroup name="shortcut" tag="div" class="td-shortcut-list">
        <div
          v-for="shortcut in activeShortcuts"
          :key="shortcutKey(shortcut)"
          class="td-shortcut-item"
          @click="shortcut.action && shortcut.action()"
        >
          <span class="td-shortcut-keys">
            <kbd v-if="shortcut.requireCtrl" class="td-shortcut-key">Ctrl</kbd>
            <kbd class="td-shortcut-key">{{ shortcut.key.toUpperCase() }}</kbd>
          </span>
          <span class="td-shortcut-label">{{ $t(shortcut.labelKey) }}</span>
        </div>
      </TransitionGroup>
    </div>

    <div class="td-footer-actions">
      <span class="td-footer-title">{{ currentTitle }}</span>
    </div>
  </div>
</template>

<script>
import TDShortcutAction from "@/common/TDShortcutAction.js";

export default {
  name: "TDFooterApp",

  data() {
    return {
      activeShortcuts: [],
    };
  },

  computed: {
    currentTitle() {
      const author = window.__env?.author || "";
      return `From ${author} with luv`;
    },
  },

  created() {
    // onChange trả về hàm cleanup — lưu lại để dùng khi unmount
    this._unsubscribe = TDShortcutAction.onChange(() => {
      this.syncShortcuts();
    });
    this.syncShortcuts();
  },

  beforeUnmount() {
    if (this._unsubscribe) this._unsubscribe();
  },

  methods: {
    /**
     * Snapshot shortcuts từ store sang local state.
     * TransitionGroup sẽ tự animate thêm/xóa item mà không blink.
     */
    syncShortcuts() {
      this.activeShortcuts = TDShortcutAction.getActiveShortcuts().map((s) => ({
        key: s.key,
        labelKey: s.labelKey,
        tooltipKey: s.tooltipKey,
        requireCtrl: s.requireCtrl,
        isVirtual: s.isVirtual,
        action: s.action,
      }));
    },

    /**
     * Key ổn định cho TransitionGroup — tránh re-mount khi shortcut không đổi.
     */
    shortcutKey(shortcut) {
      return `${shortcut.requireCtrl ? "ctrl+" : ""}${shortcut.key}`;
    },
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
  overflow: hidden;
}

/* ── Shortcut list ─────────────────────────────────────────────────────── */

.td-footer-shortcuts {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.td-shortcut-list {
  display: flex;
  align-items: center;
  gap: var(--padding);
  position: relative; /* cần cho TransitionGroup absolute positioning */
}

.td-shortcut-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: var(--border-radius);
  cursor: pointer;
  white-space: nowrap;
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
  padding: 1px 5px;
  background-color: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-bottom-width: 2px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.td-shortcut-label {
  font-size: var(--font-size-medium-rare);
  color: var(--text-secondary-color);
}

/* ── TransitionGroup animations ────────────────────────────────────────── */
/*
  Dùng opacity + translateY nhỏ để item trượt vào/ra nhẹ nhàng
  như shortcut bar của Blender — không blink, không nhảy layout.
*/

.shortcut-enter-active,
.shortcut-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}

.shortcut-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.shortcut-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/*
  Khi một item bị xóa, các item còn lại trượt vào vị trí mới thay vì nhảy.
  Cần position: absolute trong leave-active để item cũ không chiếm chỗ.
*/
.shortcut-leave-active {
  position: absolute;
}

.shortcut-move {
  transition: transform 0.15s ease;
}

/* ── Footer title ──────────────────────────────────────────────────────── */

.td-footer-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.td-footer-title {
  font-size: var(--font-size-medium-rare);
  color: var(--text-secondary-color);
  white-space: nowrap;
}
</style>
