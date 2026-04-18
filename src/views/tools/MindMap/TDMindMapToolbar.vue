<template>
  <div class="td-mm-toolbar">
    <!-- New mind map -->
    <div class="td-mm-toolbar-group">
      <div
        class="flex toolbar-btn"
        @click="$emit('newMindMap')"
        v-tooltip="$t('i18nCommon.mindMap.newMindMap')"
      >
        <span class="td-icon td-new-file-icon"></span>
      </div>
    </div>

    <div class="td-mm-toolbar-sep"></div>

    <!-- File actions -->
    <div class="td-mm-toolbar-group">
      <div
        class="flex toolbar-btn"
        @click="$emit('import')"
        v-tooltip="$t('i18nCommon.mindMap.importFile')"
      >
        <span class="td-icon td-import-icon"></span>
      </div>
      <div class="td-mm-dropdown-wrap">
        <div
          class="flex toolbar-btn"
          @click.stop="toggleExportMenu"
          v-tooltip="$t('i18nCommon.mindMap.exportAs')"
        >
          <span class="td-icon td-export-icon"></span>
        </div>
        <div
          class="td-mm-dropdown"
          v-if="showExportMenu"
          v-click-outside="closeExportMenu"
        >
          <div
            v-for="fmt in exportFormats"
            :key="fmt.value"
            class="td-mm-dropdown-item"
            @click="doExport(fmt.value)"
          >
            {{ fmt.label }}
          </div>
        </div>
      </div>
    </div>

    <div class="td-mm-toolbar-sep"></div>

    <!-- Edit actions -->
    <div class="td-mm-toolbar-group">
      <div
        class="flex toolbar-btn"
        @click="$emit('undo')"
        v-tooltip="$t('i18nCommon.mindMap.undo')"
      >
        <span class="td-icon td-undo-icon"></span>
      </div>
      <div
        class="flex toolbar-btn"
        @click="$emit('redo')"
        v-tooltip="$t('i18nCommon.mindMap.redo')"
      >
        <span class="td-icon td-redo-icon"></span>
      </div>
    </div>

    <div class="td-mm-toolbar-sep"></div>

    <!-- Node actions -->
    <div class="td-mm-toolbar-group">
      <div
        class="flex toolbar-btn"
        @click="$emit('addSibling')"
        v-tooltip="$t('i18nCommon.mindMap.addSibling')"
      >
        <span class="td-icon td-add-node-icon"></span>
      </div>
      <div
        class="flex toolbar-btn"
        @click="$emit('addChild')"
        v-tooltip="$t('i18nCommon.mindMap.addChild')"
      >
        <span class="td-icon td-add-node-child-icon"></span>
      </div>
      <div
        class="flex toolbar-btn toolbar-btn-danger"
        @click="$emit('deleteNode')"
        v-tooltip="$t('i18nCommon.mindMap.deleteNode')"
      >
        <span class="td-icon td-delete-node-icon"></span>
      </div>
    </div>

    <!-- Spacer -->
    <div class="td-mm-toolbar-spacer"></div>

    <!-- Zoom controls -->
    <div class="td-mm-toolbar-group">
      <div class="flex toolbar-btn" @click="$emit('zoomOut')" v-tooltip="'-'">
        <span class="td-icon td-minus-icon"></span>
      </div>
      <span class="td-mm-scale">{{ scale }}%</span>
      <div class="flex toolbar-btn" @click="$emit('zoomIn')" v-tooltip="'+'">
        <span class="td-icon td-plus-icon"></span>
      </div>
      <div
        class="flex toolbar-btn"
        @click="$emit('fitCanvas')"
        v-tooltip="$t('i18nCommon.mindMap.fitCanvas')"
      >
        <span class="td-icon td-full-screen-icon"></span>
      </div>
    </div>
  </div>
</template>

<script>
import { exportFormats } from "./mindMapInit.js";

export default {
  name: "TDMindMapToolbar",
  props: {
    scale: { type: Number, default: 100 },
  },
  emits: [
    "newMindMap",
    "import",
    "export",
    "undo",
    "redo",
    "addChild",
    "addSibling",
    "deleteNode",
    "zoomIn",
    "zoomOut",
    "fitCanvas",
  ],
  data() {
    return {
      exportFormats,
      showExportMenu: false,
    };
  },
  methods: {
    toggleExportMenu() {
      this.showExportMenu = !this.showExportMenu;
    },
    closeExportMenu() {
      this.showExportMenu = false;
    },
    doExport(format) {
      this.showExportMenu = false;
      this.$emit("export", format);
    },
  },
};
</script>

<style scoped>
.td-mm-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 var(--padding);
  background: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  flex-shrink: 0;
  flex-wrap: wrap;
  margin-bottom: var(--padding);
}

.td-mm-toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--padding-medium);
}

.td-mm-toolbar-sep {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 var(--padding);
  flex-shrink: 0;
}

.td-mm-toolbar-spacer {
  flex: 1;
}

.toolbar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
  cursor: pointer;
}

.toolbar-btn:hover {
  background-color: var(--bg-main-color);
  border: 1px solid var(--border-color);
}

.toolbar-btn-danger:hover {
  background-color: rgba(220, 50, 50, 0.2);
  border: 1px solid rgba(220, 50, 50, 0.4);
}

.td-mm-scale {
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
  min-width: 40px;
  text-align: center;
  user-select: none;
}

.td-mm-dropdown-wrap {
  position: relative;
}

.td-mm-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 180px;
  background: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  padding: 4px 0;
  box-shadow: var(--box-shadow);
  z-index: 100;
}

.td-mm-dropdown-item {
  padding: var(--padding) var(--padding-large);
  font-size: var(--font-size-medium-rare);
  color: var(--text-primary-color);
  cursor: pointer;
  transition: background 0.15s;
}

.td-mm-dropdown-item:hover {
  background: var(--bg-focus-color);
}
</style>
