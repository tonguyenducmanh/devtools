<template>
  <div
    class="td-mindmap-root"
    @dragenter.stop.prevent="onDragEnter"
    @dragleave.stop.prevent
    @dragover.stop.prevent
    @drop.stop.prevent
  >
    <!-- Toolbar -->
    <TDMindMapToolbar
      :scale="scalePercent"
      :currentTheme="currentTheme"
      :currentLayout="currentLayout"
      @import="triggerImport"
      @export="handleExport"
      @undo="execCommand('BACK')"
      @redo="execCommand('FORWARD')"
      @addChild="execCommand('INSERT_CHILD_NODE')"
      @addSibling="execCommand('INSERT_NODE')"
      @deleteNode="execCommand('REMOVE_NODE')"
      @zoomIn="zoomIn"
      @zoomOut="zoomOut"
      @fitCanvas="fitCanvas"
      @themeChange="changeTheme"
      @layoutChange="changeLayout"
    />

    <!-- Mind Map Canvas -->
    <div class="td-mindmap-canvas" ref="mindMapContainer"></div>

    <!-- Context Menu -->
    <TDMindMapContextMenu
      :visible="ctxMenuVisible"
      :x="ctxMenuX"
      :y="ctxMenuY"
      :isNodeMenu="ctxMenuIsNode"
      @close="ctxMenuVisible = false"
      @editNode="startEditNode"
      @addChild="execCommand('INSERT_CHILD_NODE')"
      @addSibling="execCommand('INSERT_NODE')"
      @deleteNode="execCommand('REMOVE_NODE')"
      @copyNode="execCommand('COPY_NODE')"
      @cutNode="execCommand('CUT_NODE')"
      @pasteNode="execCommand('PASTE_NODE')"
      @expandAll="expandAll"
      @collapseAll="collapseAll"
      @fitCanvas="fitCanvas"
      @resetView="resetView"
    />

    <!-- Drag Overlay -->
    <div
      class="td-mindmap-drag-overlay"
      v-if="showDragOverlay"
      @dragleave.stop.prevent="onDragLeave"
      @dragover.stop.prevent
      @drop.stop.prevent="onDrop"
    >
      <div class="td-mindmap-drag-tip">
        <span class="td-mindmap-drag-icon">📂</span>
        <span>{{ $t("i18nCommon.mindMap.dragToImport") }}</span>
        <span class="td-mindmap-drag-formats">{{
          $t("i18nCommon.mindMap.supportedFormats")
        }}</span>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept=".xmind,.smm,.json,.md"
      style="display: none"
      @change="handleFileInputChange"
    />
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDMindMapToolbar from "./TDMindMapToolbar.vue";
import TDMindMapContextMenu from "./TDMindMapContextMenu.vue";
import {
  MindMap,
  registerPlugins,
  defaultMindMapData,
} from "./mindMapInit.js";
import xmind from "simple-mind-map/src/parse/xmind.js";
import markdown from "simple-mind-map/src/parse/markdown.js";

// Register plugins once globally
registerPlugins();

export default {
  extends: TDToolBase,
  name: "TDMindMap",
  components: { TDMindMapToolbar, TDMindMapContextMenu },

  data() {
    return {
      mindMap: null,
      scalePercent: 100,
      currentTheme: "dark2",
      currentLayout: "logicalStructure",
      // Context menu
      ctxMenuVisible: false,
      ctxMenuX: 0,
      ctxMenuY: 0,
      ctxMenuIsNode: false,
      ctxMenuNode: null,
      // Drag & drop
      showDragOverlay: false,
    };
  },

  mounted() {
    this.initMindMap();
  },

  beforeUnmount() {
    if (this.mindMap) {
      this.mindMap.destroy();
      this.mindMap = null;
    }
  },

  methods: {
    // ─── Init ───────────────────────────────────────────────
    initMindMap() {
      const data = defaultMindMapData;
      this.mindMap = new MindMap({
        el: this.$refs.mindMapContainer,
        data: data.root,
        theme: data.theme.template,
        themeConfig: data.theme.config || {},
        layout: data.layout,
        fit: false,
        nodeTextEditZIndex: 1000,
        nodeNoteTooltipZIndex: 1000,
        openRealtimeRenderOnNodeTextEdit: true,
        enableAutoEnterTextEditWhenKeydown: true,
        initRootNodePosition: ["center", "center"],
        customInnerElsAppendTo: null,
        errorHandler: (code, err) => {
          console.error("[MindMap]", code, err);
        },
      });

      this.currentTheme = data.theme.template;
      this.currentLayout = data.layout;

      // Bind events
      this.mindMap.on("scale", this.onScale);
      this.mindMap.on("node_contextmenu", this.onNodeContextMenu);
      this.mindMap.on("draw_click", this.onDrawClick);
      this.mindMap.on("node_click", this.onNodeClick);

      // Register keyboard shortcuts
      this.mindMap.keyCommand.addShortcut("Control+s", () => {
        // Placeholder for save - could be extended later
      });
    },

    // ─── Commands ───────────────────────────────────────────
    execCommand(...args) {
      if (this.mindMap) {
        this.mindMap.execCommand(...args);
      }
    },

    // ─── Events ─────────────────────────────────────────────
    onScale(scale) {
      this.scalePercent = Math.round(scale * 100);
    },

    onNodeContextMenu(e, node) {
      this.ctxMenuX = e.clientX;
      this.ctxMenuY = e.clientY;
      this.ctxMenuIsNode = true;
      this.ctxMenuNode = node;
      this.ctxMenuVisible = true;
    },

    onDrawClick() {
      this.ctxMenuVisible = false;
    },

    onNodeClick() {
      this.ctxMenuVisible = false;
    },

    startEditNode() {
      if (this.mindMap) {
        this.mindMap.renderer.startTextEdit();
      }
    },

    // ─── Zoom ───────────────────────────────────────────────
    zoomIn() {
      if (this.mindMap) this.mindMap.view.enlarge();
    },

    zoomOut() {
      if (this.mindMap) this.mindMap.view.narrow();
    },

    fitCanvas() {
      if (this.mindMap) {
        this.mindMap.view.fit();
      }
    },

    resetView() {
      if (this.mindMap) {
        this.mindMap.view.reset();
      }
    },

    // ─── Theme & Layout ─────────────────────────────────────
    changeTheme(theme) {
      if (this.mindMap) {
        this.currentTheme = theme;
        this.mindMap.setTheme(theme);
      }
    },

    changeLayout(layout) {
      if (this.mindMap) {
        this.currentLayout = layout;
        this.mindMap.setLayout(layout);
      }
    },

    // ─── Expand / Collapse ──────────────────────────────────
    expandAll() {
      if (this.mindMap) this.execCommand("EXPAND_ALL");
    },

    collapseAll() {
      if (this.mindMap) this.execCommand("UNEXPAND_ALL");
    },

    // ─── Import ─────────────────────────────────────────────
    triggerImport() {
      this.$refs.fileInput.value = "";
      this.$refs.fileInput.click();
    },

    handleFileInputChange(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      this.importFile(file);
    },

    async importFile(file) {
      const name = file.name.toLowerCase();
      try {
        if (name.endsWith(".xmind")) {
          await this.importXmind(file);
        } else if (name.endsWith(".smm") || name.endsWith(".json")) {
          await this.importSmm(file);
        } else if (name.endsWith(".md")) {
          await this.importMarkdown(file);
        } else {
          console.warn("[MindMap] Unsupported file format:", name);
          return;
        }
        this.$tdToast.success(this.$t("i18nCommon.mindMap.importSuccess"));
      } catch (err) {
        console.error("[MindMap] Import error:", err);
        this.$tdToast.error(this.$t("i18nCommon.mindMap.importError"));
      }
    },

    importSmm(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            if (typeof data !== "object") throw new Error("Invalid JSON");
            this.setMindMapData(data);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    },

    async importXmind(file) {
      const data = await xmind.parseXmindFile(file);
      this.setMindMapData(data);
    },

    importMarkdown(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = markdown.transformMarkdownTo(evt.target.result);
            this.setMindMapData(data);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    },

    setMindMapData(data) {
      if (!this.mindMap) return;
      if (data.root) {
        this.mindMap.setFullData(data);
      } else {
        this.mindMap.setData(data);
      }
      this.mindMap.view.reset();
    },

    // ─── Export ──────────────────────────────────────────────
    async handleExport(format) {
      if (!this.mindMap) return;
      const fileName = "mindmap";
      try {
        if (format === "svg") {
          await this.mindMap.export(
            format,
            true,
            fileName,
            "* { margin:0; padding:0; box-sizing:border-box; }"
          );
        } else if (format === "smm" || format === "json") {
          await this.mindMap.export(format, true, fileName, true);
        } else if (format === "png") {
          await this.mindMap.export(format, true, fileName, false, null, true);
        } else if (format === "pdf") {
          await this.mindMap.export(format, true, fileName, false, true);
        } else {
          // xmind, md, txt
          await this.mindMap.export(format, true, fileName);
        }
        this.$tdToast.success(this.$t("i18nCommon.mindMap.exportSuccess"));
      } catch (err) {
        console.error("[MindMap] Export error:", err);
        this.$tdToast.error(this.$t("i18nCommon.mindMap.exportError") || "Export error");
      }
    },

    // ─── Drag & Drop ────────────────────────────────────────
    onDragEnter() {
      this.showDragOverlay = true;
    },

    onDragLeave() {
      this.showDragOverlay = false;
    },

    onDrop(e) {
      this.showDragOverlay = false;
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) this.importFile(file);
    },

    // ─── Tab lifecycle (from TDToolBase) ────────────────────
    onTabEnter() {
      if (this.mindMap) {
        this.mindMap.resize();
      }
    },
  },
};
</script>

<style scoped>
.td-mindmap-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--bg-main-color, #1e1e1e);
}

.td-mindmap-canvas {
  flex: 1;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* ─── Drag overlay ───────────────────────────────────────── */
.td-mindmap-drag-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  backdrop-filter: blur(2px);
}

.td-mindmap-drag-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 60px;
  border: 2px dashed var(--focus-color, #0078d4);
  border-radius: 16px;
  color: var(--text-primary-color, #ffffff);
  font-size: 16px;
  pointer-events: none;
}

.td-mindmap-drag-icon {
  font-size: 48px;
}

.td-mindmap-drag-formats {
  font-size: 12px;
  color: var(--text-secondary-color, #999);
}
</style>
