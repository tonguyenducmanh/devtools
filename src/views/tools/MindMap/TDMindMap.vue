<template>
  <div class="flex td-mindmap-container">
    <!-- phần thao tác chính của tool -->
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
        @newMindMap="handleNewMindMap"
        @import="triggerImport"
        @export="handleExport"
        @undo="execCommand('BACK')"
        @redo="execCommand('FORWARD')"
        @addChild="execCommand('INSERT_CHILD_NODE')"
        @addSibling="execCommand('INSERT_NODE')"
        @deleteNode="execCommand('REMOVE_NODE')"
        @expandAll="expandAll"
        @collapseAll="collapseAll"
        @zoomIn="zoomIn"
        @zoomOut="zoomOut"
        @fitCanvas="fitCanvas"
        @addGeneralization="addGeneralization"
      />

      <!-- Mind Map Canvas -->
      <div class="td-mindmap-canvas" ref="mindMapContainer">
        <!-- Mini Map Preview -->
        <div
          class="td-mm-minimap-wrap"
          @mousedown.stop="onMiniMapMousedown"
          @mousemove.stop="onMiniMapMousemove"
          @mouseup.stop="onMiniMapMouseup"
          @mouseleave.stop="onMiniMapMouseup"
        >
          <div
            class="td-mm-minimap-svg"
            v-html="miniMapSvg"
            :style="miniMapSvgStyle"
          ></div>
          <div class="td-mm-minimap-viewbox" :style="miniMapViewBoxStyle"></div>
        </div>
      </div>

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
    <!-- phần nội dung sidebar -->
    <TDSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <!-- slide tùy chọn như cài đặt hoặc history -->
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <!-- phần sidebar Setting -->
        <div
          class="td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.MindMapSidebarOption.Setting
          "
        >
          <div class="td-sidebar-setting-group">
            <label class="td-sidebar-label">{{
              $t("i18nCommon.mindMap.theme")
            }}</label>
            <TDComboBox
              :modelValue="currentConfigLayout.currentTheme"
              @update:modelValue="changeTheme"
              :options="themeOptions"
              :noMargin="true"
              :isEditable="false"
              :isCapitalizeText="false"
              :usingStylePercent="true"
            />
          </div>
          <div class="td-sidebar-setting-group">
            <label class="td-sidebar-label">{{
              $t("i18nCommon.mindMap.layout")
            }}</label>
            <TDComboBox
              :modelValue="currentConfigLayout.currentLayout"
              @update:modelValue="changeLayout"
              :options="layoutOptions"
              :noMargin="true"
              :isEditable="false"
              :isCapitalizeText="false"
              :usingStylePercent="true"
            />
          </div>
        </div>
        <!-- phần sidebar History -->
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.MindMapSidebarOption.History
          "
        >
          <div
            v-if="historyItems && historyItems.length > 0"
            class="flex flex-col td-mm-history-list"
          >
            <div
              v-for="item in historyItems"
              :key="item.historyId"
              class="flex td-mm-history-item"
              @click="applyHistory(item)"
            >
              <div class="td-mm-history-info">
                <span class="td-mm-history-title" v-tooltip="item.title">{{
                  item.title
                }}</span>
                <span class="td-mm-history-time">{{ item.timeDisplay }}</span>
              </div>
              <div
                class="td-icon td-close-icon"
                @click.stop="deleteHistoryItem(item.historyId)"
                v-tooltip="$t('i18nCommon.apiTesting.delete')"
              ></div>
            </div>
          </div>
          <div v-else class="td-mm-history-empty">
            {{ $t("i18nCommon.noDataAvailable") }}
          </div>
          <TDButton
            v-if="historyItems && historyItems.length > 0"
            @click="clearAllHistory"
            :type="$tdEnum.buttonType.secondary"
            :label="$t('i18nCommon.deleteAll')"
          ></TDButton>
        </div>
      </template>
    </TDSubSidebar>
    <!-- hết phần nội dung sidebar -->
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDMindMapToolbar from "./TDMindMapToolbar.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDSlideOption from "@/components/TDSlideOption.vue";
import TDComboBox from "@/components/TDComboBox.vue";
import {
  MindMap,
  registerPlugins,
  defaultMindMapData,
  themeOptions,
  layoutOptions,
} from "./mindMapInit.js";
import xmind from "simple-mind-map/src/parse/xmind.js";
import markdown from "simple-mind-map/src/parse/markdown.js";

// Register plugins once globally
registerPlugins();

const AUTO_SAVE_INTERVAL =
  window.__env.mindMapConfig?.autoSaveIntervalInSecond * 1000 || 60000;
const MAX_HISTORY_ITEMS = window.__env.mindMapConfig?.maxHistoryItems || 50;

export default {
  extends: TDToolBase,
  name: "TDMindMap",
  components: { TDMindMapToolbar, TDSubSidebar, TDSlideOption, TDComboBox },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.MindMapConfigLayout,
      currentConfigLayout: {
        isShowSidebar: false,
        currentSidebarOption: this.$tdEnum.MindMapSidebarOption.Setting,
        currentTheme: "classic4",
        currentLayout: "logicalStructure",
      },
      mindMap: null,
      scalePercent: 100,
      // Drag & drop
      showDragOverlay: false,
      // History
      historyItems: [],
      autoSaveTimer: null,
      // Options for sidebar
      themeOptions,
      layoutOptions,
      // Mini map
      miniMapSvg: "",
      miniMapSvgStyle: {},
      miniMapViewBoxStyle: {},
      resizeObserver: null,
    };
  },

  computed: {
    sidebarOptions() {
      return [
        {
          value: this.$tdEnum.MindMapSidebarOption.Setting,
          label: this.$t("i18nCommon.mindMap.sidebarOption.setting"),
          icon: "td-setting-icon",
        },
        {
          value: this.$tdEnum.MindMapSidebarOption.History,
          label: this.$t("i18nCommon.mindMap.sidebarOption.history"),
          icon: "td-history-icon",
        },
      ];
    },
  },

  mounted() {
    // Delay init to ensure container has computed dimensions
    // ($nextTick is not enough due to tab system layout timing)
    setTimeout(async () => {
      // Load history và dùng bản ghi gần nhất nếu có
      await this.loadHistory();
      let initData = null;
      if (this.historyItems && this.historyItems.length > 0) {
        initData = this.historyItems[0].data; // historyItems đã reverse, [0] là mới nhất
      }
      this.initMindMap(initData);
    }, 100);
    this.startAutoSave();
  },

  beforeUnmount() {
    this.stopAutoSave();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mindMap) {
      this.mindMap.destroy();
      this.mindMap = null;
    }
  },

  methods: {
    // ─── Init ───────────────────────────────────────────────
    initMindMap(savedData) {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      const data = savedData || defaultMindMapData;
      this.mindMap = new MindMap({
        el: this.$refs.mindMapContainer,
        data: data.root,
        theme: this.currentConfigLayout.currentTheme,
        themeConfig: data.theme.config || {},
        layout: this.currentConfigLayout.currentLayout,
        fit: true,
        nodeTextEditZIndex: 1000,
        nodeNoteTooltipZIndex: 1000,
        openRealtimeRenderOnNodeTextEdit: true,
        enableAutoEnterTextEditWhenKeydown: true,
        initRootNodePosition: ["center", "center"],
        customInnerElsAppendTo: null,
        defaultInsertBelowSecondLevelNodeText: "",
        defaultInsertSecondLevelNodeText: "",
        errorHandler: (code, err) => {
          console.error("[MindMap]", code, err);
        },
      });

      // Resize observer
      this.resizeObserver = new ResizeObserver(() => {
        if (this.mindMap) {
          this.mindMap.resize();
        }
      });
      this.resizeObserver.observe(this.$refs.mindMapContainer);

      // Bind events
      this.mindMap.on("scale", this.onScale);
      this.mindMap.on("node_contextmenu", this.onNodeContextMenu);
      this.mindMap.on("contextmenu", this.onCanvasContextMenu);
      this.mindMap.on("data_change", this.updateMiniMap);
      this.mindMap.on("view_data_change", this.updateMiniMap);
      this.mindMap.on("node_tree_render_end", this.updateMiniMap);

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
      this.ctxMenuNode = node;
      if (!node.nodeData?.isActive) {
        node.active(e);
      }
      this.$tdContextMenu.open(e, [
        {
          key: "edit",
          label: this.$t("i18nCommon.mindMap.editNode"),
          action: () => this.startEditNode(),
        },
        {
          key: "addChild",
          label: this.$t("i18nCommon.mindMap.addChild"),
          action: () => this.execCommand("INSERT_CHILD_NODE"),
        },
        {
          key: "addSibling",
          label: this.$t("i18nCommon.mindMap.addSibling"),
          action: () => this.execCommand("INSERT_NODE"),
        },
        {
          key: "delete",
          label: this.$t("i18nCommon.mindMap.deleteNode"),
          action: () => this.execCommand("REMOVE_NODE"),
        },
        {
          key: "copy",
          label: this.$t("i18nCommon.mindMap.copy"),
          action: () => this.mindMap.renderer.copy(),
        },
        {
          key: "cut",
          label: this.$t("i18nCommon.mindMap.cut"),
          action: () => this.mindMap.renderer.cut(),
        },
        {
          key: "paste",
          label: this.$t("i18nCommon.mindMap.paste"),
          action: () => this.mindMap.renderer.paste(),
        },
      ]);
    },

    onCanvasContextMenu(e) {
      this.$tdContextMenu.open(e, [
        {
          key: "expandAll",
          label: this.$t("i18nCommon.mindMap.expandAll"),
          action: () => this.expandAll(),
        },
        {
          key: "collapseAll",
          label: this.$t("i18nCommon.mindMap.collapseAll"),
          action: () => this.collapseAll(),
        },
        {
          key: "fitCanvas",
          label: this.$t("i18nCommon.mindMap.fitCanvas"),
          action: () => this.fitCanvas(),
        },
        {
          key: "resetView",
          label: this.$t("i18nCommon.mindMap.resetView"),
          action: () => this.resetView(),
        },
      ]);
    },

    startEditNode() {
      if (this.mindMap && this.ctxMenuNode) {
        this.mindMap.renderer.textEdit.show({ node: this.ctxMenuNode });
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
        this.currentConfigLayout.currentTheme = theme;
        this.mindMap.setTheme(theme);
        this.updateConfigLayout();
      }
    },

    changeLayout(layout) {
      if (this.mindMap) {
        this.currentConfigLayout.currentLayout = layout;
        this.mindMap.setLayout(layout);
        this.updateConfigLayout();
      }
    },

    // ─── New Mind Map ───────────────────────────────────────
    async handleNewMindMap() {
      // Lưu mindmap hiện tại vào history trước khi reset
      await this.saveSnapshot();
      // Tạo data mới nhưng giữ nguyên theme và layout hiện tại
      const newData = JSON.parse(JSON.stringify(defaultMindMapData));
      newData.theme.template = this.currentConfigLayout.currentTheme;
      newData.layout = this.currentConfigLayout.currentLayout;
      this.setMindMapData(newData);
    },

    // ─── Expand / Collapse ──────────────────────────────────
    expandAll() {
      if (this.mindMap) this.execCommand("EXPAND_ALL");
    },

    collapseAll() {
      if (this.mindMap) this.execCommand("UNEXPAND_ALL");
    },
    addGeneralization() {
      if (this.mindMap) this.execCommand("ADD_GENERALIZATION");
    },

    // ─── Mini Map ───────────────────────────────────────────
    updateMiniMap() {
      if (!this.mindMap || !this.mindMap.miniMap) return;
      try {
        const {
          svgHTML,
          viewBoxStyle,
          miniMapBoxScale,
          miniMapBoxLeft,
          miniMapBoxTop,
        } = this.mindMap.miniMap.calculationMiniMap(200, 140);
        this.miniMapSvg = svgHTML;
        this.miniMapViewBoxStyle = viewBoxStyle;
        this.miniMapSvgStyle = {
          transform: `scale(${miniMapBoxScale})`,
          left: miniMapBoxLeft + "px",
          top: miniMapBoxTop + "px",
        };
      } catch (e) {
        console.error("[MindMap] MiniMap error:", e);
      }
    },

    onMiniMapMousedown(e) {
      if (!this.mindMap || !this.mindMap.miniMap) return;
      if (e.target.classList.contains("td-mm-minimap-viewbox")) {
        this.mindMap.miniMap.onViewBoxMousedown(e);
      } else {
        this.mindMap.miniMap.onMousedown(e);
      }
    },

    onMiniMapMousemove(e) {
      if (!this.mindMap || !this.mindMap.miniMap) return;
      if (this.mindMap.miniMap.isViewBoxMousedown) {
        this.mindMap.miniMap.onViewBoxMousemove(e);
      } else {
        this.mindMap.miniMap.onMousemove(e);
      }
    },

    onMiniMapMouseup(e) {
      if (!this.mindMap || !this.mindMap.miniMap) return;
      this.mindMap.miniMap.onMouseup(e);
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
      setTimeout(() => {
        this.fitCanvas();
      }, 100);
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
            "* { margin:0; padding:0; box-sizing:border-box; }",
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
        this.$tdToast.error(
          this.$t("i18nCommon.mindMap.exportError") || "Export error",
        );
      }
    },

    // ─── History (auto-save) ────────────────────────────────
    startAutoSave() {
      this.autoSaveTimer = setInterval(() => {
        this.saveSnapshot();
      }, AUTO_SAVE_INTERVAL);
    },

    stopAutoSave() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
    },

    async saveSnapshot() {
      if (!this.mindMap) return;
      try {
        const fullData = this.mindMap.getData(true);
        const rootText = fullData?.root?.data?.text || "Mind Map";
        const now = new Date();
        const entry = {
          historyId: this.$tdUtility.newGuid(),
          timestamp: now.getTime(),
          title: this.$tdUtility.stripHtml(rootText),
          timeDisplay: this.formatTime(now),
          data: fullData,
        };

        let history = await this.getHistoryFromCache();

        // Kiểm tra xem có thay đổi so với bản ghi gần nhất không
        if (history.length > 0) {
          const lastHistory = history[history.length - 1];
          if (JSON.stringify(lastHistory.data) === JSON.stringify(fullData)) {
            return; // Bỏ qua nếu không có thay đổi gì
          }
        }

        history.push(entry);

        // Giới hạn số lượng
        while (history.length > MAX_HISTORY_ITEMS) {
          history.shift();
        }

        await this.$tdCache.set(
          this.$tdEnum.cacheConfig.MindMapHistory,
          history,
        );
        this.historyItems = [...history].reverse();
      } catch (err) {
        console.error("[MindMap] Auto-save error:", err);
      }
    },

    async loadHistory() {
      try {
        const history = await this.getHistoryFromCache();
        this.historyItems = [...history].reverse();
      } catch (err) {
        console.error("[MindMap] Load history error:", err);
      }
    },

    async getHistoryFromCache() {
      let history = await this.$tdCache.get(
        this.$tdEnum.cacheConfig.MindMapHistory,
      );
      if (history) {
        if (!Array.isArray(history)) {
          history = JSON.parse(history);
        }
      } else {
        history = [];
      }
      return history;
    },

    applyHistory(item) {
      if (item && item.data) {
        this.setMindMapData(item.data);
        // Cập nhật config nếu dữ liệu có theme/layout
        if (item.data.theme?.template) {
          this.currentConfigLayout.currentTheme = item.data.theme.template;
        }
        if (item.data.layout) {
          this.currentConfigLayout.currentLayout = item.data.layout;
        }
        this.updateConfigLayout();
        this.$tdToast.success(this.$t("i18nCommon.mindMap.historyRollback"));
      }
    },

    async deleteHistoryItem(historyId) {
      try {
        let history = await this.getHistoryFromCache();
        history = history.filter((x) => x.historyId !== historyId);
        await this.$tdCache.set(
          this.$tdEnum.cacheConfig.MindMapHistory,
          history,
        );
        this.historyItems = [...history].reverse();
        this.$tdToast.success(this.$t("i18nCommon.toastMessage.removed"));
      } catch (err) {
        console.error("[MindMap] Delete history error:", err);
      }
    },

    async clearAllHistory() {
      try {
        await this.$tdCache.remove(this.$tdEnum.cacheConfig.MindMapHistory);
        this.historyItems = [];
        this.$tdToast.success(this.$t("i18nCommon.toastMessage.removed"));
      } catch (err) {
        console.error("[MindMap] Clear history error:", err);
      }
    },

    formatTime(date) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
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
.td-mindmap-container {
  width: 100%;
  height: 100%;
}

.td-mindmap-root {
  flex: 1;
  min-width: 0;
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

/* ─── Mini Map ───────────────────────────────────────────── */
.td-mm-minimap-wrap {
  position: absolute;
  bottom: var(--padding);
  right: var(--padding);
  width: 200px;
  height: 140px;
  background: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  box-shadow: var(--box-shadow);
  z-index: 50;
  overflow: hidden;
  user-select: none;
}

.td-mm-minimap-svg {
  position: absolute;
  transform-origin: 0 0;
}

.td-mm-minimap-viewbox {
  position: absolute;
  border: 2px solid var(--focus-color, #0078d4);
  background: rgba(0, 120, 212, 0.1);
  cursor: move;
  transition: all 0.1s linear;
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

/* ─── Sidebar content ────────────────────────────────────── */
.td-sidebar-content {
  margin-top: var(--padding);
  height: 100%;
  width: 100%;
  min-height: 0;
}

.td-sidebar-setting-group {
  margin-bottom: var(--padding);
  width: 100%;
}

.td-sidebar-label {
  display: block;
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
  margin-bottom: 4px;
}

/* ─── History ────────────────────────────────────────────── */
.td-mm-history-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  gap: 2px;
  margin-bottom: var(--padding);
  width: 100%;
  justify-content: flex-start;
}

.td-mm-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding);
  border-radius: var(--border-radius);
  cursor: pointer;
  gap: var(--padding);
  transition: background 0.15s;
  width: 100%;
}

.td-mm-history-item:hover {
  background-color: var(--bg-layer-color);
}

.td-mm-history-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.td-mm-history-title {
  font-size: var(--font-size-medium-rare);
  color: var(--text-primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.td-mm-history-time {
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
}

.td-mm-history-empty {
  padding: var(--padding-large);
  text-align: center;
  color: var(--text-secondary-color);
  font-size: var(--font-size-small);
}
</style>
