<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    :title="$t('i18nCommon.tdheader.showAllShortcut')"
    @close="handleClose"
    height="unset"
    width="unset"
  >
    <div class="td-shortcut-popup">
      <div class="td-shortcut-popup__grid">
        <div
          v-for="item in activeShortcuts"
          :key="item.key"
          class="td-shortcut-popup__item"
        >
          <span class="td-shortcut-popup__keys">
            <kbd v-for="part in item.presentKey" :key="part">{{ part }}</kbd>
          </span>
          <span class="td-shortcut-popup__label">{{ $t(item.labelKey) }}</span>
        </div>
      </div>
    </div>
  </TDPopup>
</template>

<script>
import TDPopup from "@/components/TDPopup.vue";
import TDShortcutAction from "@/common/TDShortcutAction.js";

export default {
  name: "TDShowAllShortcutPopup",
  components: { TDPopup },
  props: {
    ownerForm: { type: Object, default: null },
    onClose: { type: Function, default: null },
  },
  data() {
    return {
      activeShortcuts: [],
    };
  },
  created() {
    TDShortcutAction.onChange(() => {
      this.updateActiveShortcuts();
    });
  },
  mounted() {
    this.updateActiveShortcuts();
  },
  methods: {
    show() {},
    handleClose() {
      this.onClose?.();
    },
    updateActiveShortcuts() {
      const componentShortcuts = TDShortcutAction.getActiveShortcuts();
      this.activeShortcuts = [...componentShortcuts];
    },
  },
};
</script>

<style scoped>
.td-shortcut-popup {
  /* wrapper để center inline-grid bên trong */
  display: flex;
  justify-content: center;
  margin: var(--padding);
}
.td-shortcut-popup__grid {
  /* inline-grid: tự co width vừa đủ nội dung, không ép full width */
  display: inline-grid;
  grid-template-columns: repeat(3, max-content);
  gap: 4px 16px;
  align-items: center;
}
.td-shortcut-popup__item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  white-space: nowrap;
}
.td-shortcut-popup__keys {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.td-shortcut-popup__label {
  font-size: 11px;
  color: var(--text-secondary-color);
  white-space: nowrap;
}
.td-shortcut-popup kbd {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 11px;
  font-family: inherit;
  background: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
