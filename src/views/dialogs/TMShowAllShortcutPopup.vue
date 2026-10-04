<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    :title="$t('i18nCommon.tmheader.showAllShortcut')"
    @close="handleClose"
    height="unset"
    width="unset"
  >
    <div class="tm-shortcut-popup">
      <div class="tm-shortcut-popup__grid">
        <div
          v-for="item in activeShortcuts"
          :key="item.key"
          class="tm-shortcut-popup__item"
        >
          <span class="tm-shortcut-popup__keys">
            <kbd v-for="part in item.presentKey" :key="part">{{ part }}</kbd>
          </span>
          <span class="tm-shortcut-popup__label">{{ $t(item.labelKey) }}</span>
        </div>
      </div>
    </div>
  </TMPopup>
</template>

<script>
import TMPopup from "@/components/TMPopup.vue";
import TMShortcutAction from "@/common/TMShortcutAction.js";

export default {
  name: "TMShowAllShortcutPopup",
  components: { TMPopup },
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
    TMShortcutAction.onChange(() => {
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
      const componentShortcuts = TMShortcutAction.getActiveShortcuts();
      this.activeShortcuts = [...componentShortcuts];
    },
  },
};
</script>

<style scoped>
.tm-shortcut-popup {
  /* wrapper để center inline-grid bên trong */
  display: flex;
  justify-content: center;
  margin: var(--padding);
}
.tm-shortcut-popup__grid {
  /* inline-grid: tự co width vừa đủ nội dung, không ép full width */
  display: inline-grid;
  grid-template-columns: repeat(3, max-content);
  gap: 4px 16px;
  align-items: center;
}
.tm-shortcut-popup__item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  white-space: nowrap;
}
.tm-shortcut-popup__keys {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.tm-shortcut-popup__label {
  font-size: 11px;
  color: var(--text-secondary-color);
  white-space: nowrap;
}
.tm-shortcut-popup kbd {
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
