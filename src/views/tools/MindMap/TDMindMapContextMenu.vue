<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="td-mm-ctx-backdrop"
      @click.self="$emit('close')"
      @contextmenu.prevent="$emit('close')"
    >
      <div
        class="td-mm-ctx-menu"
        :style="{ left: x + 'px', top: y + 'px' }"
      >
        <template v-if="isNodeMenu">
          <div class="td-mm-ctx-item" @click="emit('editNode')">
            <span class="td-mm-ctx-icon">✏️</span>
            {{ $t("i18nCommon.mindMap.editNode") }}
          </div>
          <div class="td-mm-ctx-item" @click="emit('addChild')">
            <span class="td-mm-ctx-icon">↳</span>
            {{ $t("i18nCommon.mindMap.addChild") }}
          </div>
          <div class="td-mm-ctx-item" @click="emit('addSibling')">
            <span class="td-mm-ctx-icon">↔</span>
            {{ $t("i18nCommon.mindMap.addSibling") }}
          </div>
          <div class="td-mm-ctx-sep"></div>
          <div class="td-mm-ctx-item" @click="emit('copyNode')">
            <span class="td-mm-ctx-icon">📋</span>
            {{ $t("i18nCommon.copy") }}
          </div>
          <div class="td-mm-ctx-item" @click="emit('cutNode')">
            <span class="td-mm-ctx-icon">✂️</span>
            {{ $t("i18nCommon.mindMap.cut") }}
          </div>
          <div class="td-mm-ctx-item" @click="emit('pasteNode')">
            <span class="td-mm-ctx-icon">📄</span>
            {{ $t("i18nCommon.mindMap.paste") }}
          </div>
          <div class="td-mm-ctx-sep"></div>
          <div class="td-mm-ctx-item td-mm-ctx-danger" @click="emit('deleteNode')">
            <span class="td-mm-ctx-icon">🗑</span>
            {{ $t("i18nCommon.mindMap.deleteNode") }}
          </div>
        </template>
        <template v-else>
          <div class="td-mm-ctx-item" @click="emit('expandAll')">
            <span class="td-mm-ctx-icon">⊞</span>
            {{ $t("i18nCommon.mindMap.expandAll") }}
          </div>
          <div class="td-mm-ctx-item" @click="emit('collapseAll')">
            <span class="td-mm-ctx-icon">⊟</span>
            {{ $t("i18nCommon.mindMap.collapseAll") }}
          </div>
          <div class="td-mm-ctx-sep"></div>
          <div class="td-mm-ctx-item" @click="emit('fitCanvas')">
            <span class="td-mm-ctx-icon">⊡</span>
            {{ $t("i18nCommon.mindMap.fitCanvas") }}
          </div>
          <div class="td-mm-ctx-item" @click="emit('resetView')">
            <span class="td-mm-ctx-icon">↺</span>
            {{ $t("i18nCommon.mindMap.resetView") }}
          </div>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: "TDMindMapContextMenu",
  props: {
    visible: { type: Boolean, default: false },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    isNodeMenu: { type: Boolean, default: false },
  },
  emits: [
    "close",
    "editNode",
    "addChild",
    "addSibling",
    "deleteNode",
    "copyNode",
    "cutNode",
    "pasteNode",
    "expandAll",
    "collapseAll",
    "fitCanvas",
    "resetView",
  ],
  methods: {
    emit(event) {
      this.$emit(event);
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.td-mm-ctx-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

.td-mm-ctx-menu {
  position: fixed;
  min-width: 200px;
  background: var(--bg-layer-color, #252526);
  border: 1px solid var(--border-color, #3c3c3c);
  border-radius: 6px;
  padding: 4px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 10000;
  font-size: 13px;
}

.td-mm-ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  cursor: pointer;
  color: var(--text-primary-color, #cccccc);
  transition: background-color 0.12s;
  user-select: none;
}

.td-mm-ctx-item:hover {
  background: var(--focus-color, #094771);
}

.td-mm-ctx-icon {
  width: 20px;
  text-align: center;
  font-size: 14px;
  flex-shrink: 0;
}

.td-mm-ctx-danger:hover {
  background: #5a1d1d;
}

.td-mm-ctx-sep {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-color, #3c3c3c);
}
</style>
