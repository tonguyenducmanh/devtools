<template>
  <div class="td-mm-toolbar">
    <!-- File actions -->
    <div class="td-mm-toolbar-group">
      <button class="td-mm-btn" @click="$emit('import')" :title="$t('i18nCommon.mindMap.importFile')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 3h4v1H4v8h8V8h1v5H3V3zm5 0h4v4h-1V4.7L7.4 8.3 6.7 7.6 10.3 4H8V3z"/>
        </svg>
        <span>{{ $t("i18nCommon.mindMap.import") }}</span>
      </button>
      <div class="td-mm-dropdown-wrap">
        <button class="td-mm-btn" @click="toggleExportMenu" :title="$t('i18nCommon.mindMap.exportAs')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13 3H3v10h10V3zm-1 9H4V4h8v8zM7 8H5v1h2v2h1V9h2V8H8V6H7v2z"/>
          </svg>
          <span>{{ $t("i18nCommon.mindMap.export") }}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="margin-left:2px">
            <path d="M2 3.5L5 7l3-3.5H2z"/>
          </svg>
        </button>
        <div class="td-mm-dropdown" v-if="showExportMenu" @mouseleave="showExportMenu = false">
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
      <button class="td-mm-btn" @click="$emit('undo')" :title="$t('i18nCommon.mindMap.undo')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 7h6a4 4 0 110 8H6v-1h3a3 3 0 100-6H4.3l2.85 2.85-.7.7L2.5 7.6l3.95-3.95.7.7L4.3 7H3z"/>
        </svg>
      </button>
      <button class="td-mm-btn" @click="$emit('redo')" :title="$t('i18nCommon.mindMap.redo')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13 7H7a4 4 0 100 8h3v-1H7a3 3 0 110-6h4.7l-2.85 2.85.7.7L13.5 7.6 9.55 3.65l-.7.7L11.7 7H13z"/>
        </svg>
      </button>
    </div>

    <div class="td-mm-toolbar-sep"></div>

    <!-- Node actions -->
    <div class="td-mm-toolbar-group">
      <button class="td-mm-btn" @click="$emit('addChild')" :title="$t('i18nCommon.mindMap.addChild')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1v6H2v1h6v6h1V8h6V7H9V1H8z"/>
        </svg>
        <span>{{ $t("i18nCommon.mindMap.child") }}</span>
      </button>
      <button class="td-mm-btn" @click="$emit('addSibling')" :title="$t('i18nCommon.mindMap.addSibling')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 8h14v1H1V8zm0-4h14v1H1V4zm0 8h14v1H1v-1z"/>
        </svg>
        <span>{{ $t("i18nCommon.mindMap.sibling") }}</span>
      </button>
      <button class="td-mm-btn td-mm-btn-danger" @click="$emit('deleteNode')" :title="$t('i18nCommon.mindMap.deleteNode')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 3h3v1h-1v9H4V4H3V3h3V2h4v1zM5 4v9h6V4H5zm1 1h1v7H6V5zm3 0h1v7H9V5z"/>
        </svg>
      </button>
    </div>

    <div class="td-mm-toolbar-sep"></div>

    <!-- Theme & Layout -->
    <div class="td-mm-toolbar-group">
      <div class="td-mm-select-wrap">
        <label class="td-mm-label">{{ $t("i18nCommon.mindMap.theme") }}</label>
        <select
          class="td-mm-select"
          :value="currentTheme"
          @change="$emit('themeChange', $event.target.value)"
        >
          <option v-for="t in themeOptions" :key="t.value" :value="t.value">
            {{ t.label }}
          </option>
        </select>
      </div>
      <div class="td-mm-select-wrap">
        <label class="td-mm-label">{{ $t("i18nCommon.mindMap.layout") }}</label>
        <select
          class="td-mm-select"
          :value="currentLayout"
          @change="$emit('layoutChange', $event.target.value)"
        >
          <option v-for="l in layoutOptions" :key="l.value" :value="l.value">
            {{ l.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Spacer -->
    <div class="td-mm-toolbar-spacer"></div>

    <!-- Zoom controls -->
    <div class="td-mm-toolbar-group">
      <button class="td-mm-btn td-mm-btn-sm" @click="$emit('zoomOut')" title="-">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M2 6.5h10v1H2z"/></svg>
      </button>
      <span class="td-mm-scale">{{ scale }}%</span>
      <button class="td-mm-btn td-mm-btn-sm" @click="$emit('zoomIn')" title="+">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7.5 2v4.5H12v1H7.5V12h-1V7.5H2v-1h4.5V2z"/></svg>
      </button>
      <button class="td-mm-btn td-mm-btn-sm" @click="$emit('fitCanvas')" :title="$t('i18nCommon.mindMap.fitCanvas')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M2 2v4h1V3.4L5.6 6l.7-.7L3.4 3H6V2H2zm6 0v1h2.6L8 5.6l.7.7L11.6 3H12v3h1V2H8zM5.6 8L3 10.6V8H2v4h4v-1H3.4L6 8.4 5.3 8H5.6zM8.7 8l-.7.7L10.6 11H8v1h4V8h-1v2.6L8.7 8z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { themeOptions, layoutOptions, exportFormats } from "./mindMapInit.js";

export default {
  name: "TDMindMapToolbar",
  props: {
    scale: { type: Number, default: 100 },
    currentTheme: { type: String, default: "dark2" },
    currentLayout: { type: String, default: "logicalStructure" },
  },
  emits: [
    "import", "export", "undo", "redo",
    "addChild", "addSibling", "deleteNode",
    "zoomIn", "zoomOut", "fitCanvas",
    "themeChange", "layoutChange",
  ],
  data() {
    return {
      themeOptions,
      layoutOptions,
      exportFormats,
      showExportMenu: false,
    };
  },
  methods: {
    toggleExportMenu() {
      this.showExportMenu = !this.showExportMenu;
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
  padding: 6px 12px;
  background: var(--bg-layer-color, #1e1e1e);
  border-bottom: 1px solid var(--border-color, #3c3c3c);
  flex-shrink: 0;
  flex-wrap: wrap;
  min-height: 40px;
  z-index: 10;
}

.td-mm-toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.td-mm-toolbar-sep {
  width: 1px;
  height: 22px;
  background: var(--border-color, #3c3c3c);
  margin: 0 6px;
  flex-shrink: 0;
}

.td-mm-toolbar-spacer {
  flex: 1;
}

.td-mm-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--text-primary-color, #cccccc);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  line-height: 1;
}

.td-mm-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border-color, #3c3c3c);
}

.td-mm-btn:active {
  background: rgba(255, 255, 255, 0.12);
}

.td-mm-btn-sm {
  padding: 4px 6px;
}

.td-mm-btn-danger:hover {
  background: rgba(220, 50, 50, 0.2);
  color: #f48771;
}

.td-mm-scale {
  font-size: 12px;
  color: var(--text-secondary-color, #999);
  min-width: 40px;
  text-align: center;
  user-select: none;
}

.td-mm-select-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.td-mm-label {
  font-size: 11px;
  color: var(--text-secondary-color, #999);
  white-space: nowrap;
}

.td-mm-select {
  background: var(--bg-main-color, #2d2d2d);
  color: var(--text-primary-color, #cccccc);
  border: 1px solid var(--border-color, #3c3c3c);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 12px;
  cursor: pointer;
  max-width: 140px;
  outline: none;
}

.td-mm-select:focus {
  border-color: var(--focus-color, #094771);
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
  background: var(--bg-layer-color, #252526);
  border: 1px solid var(--border-color, #3c3c3c);
  border-radius: 6px;
  padding: 4px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.td-mm-dropdown-item {
  padding: 6px 14px;
  font-size: 13px;
  color: var(--text-primary-color, #cccccc);
  cursor: pointer;
  transition: background 0.12s;
}

.td-mm-dropdown-item:hover {
  background: var(--focus-color, #094771);
}
</style>
