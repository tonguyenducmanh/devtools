<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex flex-col input-section" :style="inputSectionStyle">
        <div class="flex input-area">
          <TMTextEditor
            v-if="currentConfigLayout.sourceType === 'text'"
            :modelValue="textSource"
            :placeHolder="$t('i18nCommon.cimbar.encode.textPlaceholder')"
            :readOnly="isPreparing || isEncoding"
            class="source-editor"
            @update:modelValue="handleTextSourceChange"
          ></TMTextEditor>
          <TMUpload
            v-else
            ref="fileUpload"
            class="flex-one source-file"
            :labelEmpty="$t('i18nCommon.cimbar.encode.noFile')"
            :readOnly="isPreparing || isEncoding"
            @selected="handleFileSelected"
          ></TMUpload>
          <!-- Text: nút xếp dọc bên phải editor. File: nút xếp ngang 1 dòng
               vì ô upload chỉ cao 1 dòng. -->
          <div
            class="flex button-generate"
            :class="
              currentConfigLayout.sourceType === 'file'
                ? 'button-generate-row'
                : 'flex-col'
            "
          >
            <TMButton
              :noMargin="true"
              :readOnly="!canStartEncode || isPreparing || isEncoding"
              @click="startEncode"
              iconClass="tm-send-icon"
              v-tooltip="$t('i18nCommon.cimbar.encode.start')"
            ></TMButton>
            <TMButton
              :noMargin="true"
              :type="$tmEnum.buttonType.secondary"
              :readOnly="!isEncoding && !isPreparing"
              @click="stopEncode"
              iconClass="tm-cancel-icon"
              v-tooltip="$t('i18nCommon.cimbar.encode.stop')"
            ></TMButton>
            <TMButton
              :noMargin="true"
              :type="$tmEnum.buttonType.secondary"
              :readOnly="!isEncoding"
              @click="toggleFullTab"
              iconClass="tm-full-screen-icon"
              v-tooltip="$t('i18nCommon.cimbar.encode.fullscreen')"
            ></TMButton>
          </div>
        </div>
        <div class="flex group-footer-input">
          <div class="flex footer-status">
            <span class="text-nowrap">{{ sourceSummary }}</span>
            <span v-if="isPreparing" class="generating-status">
              · {{ $t("i18nCommon.cimbar.encode.preparing") }}
              {{ encodeProgress }}%
            </span>
            <span v-else-if="isEncoding" class="generating-status">
              · {{ $t("i18nCommon.cimbar.encode.encoding") }}
            </span>
          </div>
          <div v-if="encodeMd5" class="flex md5-box">
            <span class="md5-label">
              {{ $t("i18nCommon.cimbar.encode.md5") }}
            </span>
            <span class="md5-value" :title="encodeMd5">{{ encodeMd5 }}</span>
          </div>
        </div>
      </div>

      <!-- Resizer -->
      <TMResizer
        v-if="isEncoding && !isFileSource"
        :direction="'vertical'"
        @resize="handleResize"
        :minSize="15"
      />

      <TMFullTabWrapper
        v-show="showResult"
        v-model="isFullTab"
        :hidePin="true"
        :style="resultSectionStyle"
        class="cimbar-wrapper"
      >
        <div ref="canvasPanel" class="flex flex-one canvas-panel">
          <canvas
            ref="encodeCanvas"
            class="cimbar-canvas"
            width="1024"
            height="1024"
          ></canvas>
        </div>
      </TMFullTabWrapper>
    </div>

    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Help
          "
        >
          <TMCimbarEncodeHelp />
        </div>
        <div
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Setting
          "
        >
          <div class="flex flex-col input-config">
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.cimbar.encode.source")
              }}</span>
              <TMComboBox
                v-model="currentConfigLayout.sourceType"
                :options="sourceOptions"
                :readOnly="isPreparing || isEncoding"
                :width="140"
                :noMargin="true"
                @selected="handleSourceTypeChange"
              />
            </div>
            <div
              v-if="currentConfigLayout.sourceType === 'text'"
              class="flex input-config-item"
            >
              <span class="title-input-config">{{
                $t("i18nCommon.cimbar.encode.fileName")
              }}</span>
              <TMInput
                v-model="currentConfigLayout.textFileName"
                class="value-input-config"
                :placeHolder="'text.txt'"
                :noMargin="true"
                :readOnly="isPreparing || isEncoding"
                @clickOutSide="updateConfigLayout"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.cimbar.encode.mode")
              }}</span>
              <TMComboBox
                v-model="currentConfigLayout.encodeMode"
                :options="encodeModeOptions"
                :readOnly="isPreparing || isEncoding"
                :width="140"
                :noMargin="true"
                @selected="handleEncodeModeChange"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.cimbar.encode.fps")
              }}</span>
              <TMComboBox
                v-model="currentConfigLayout.encodeFps"
                :options="fpsOptions"
                :width="140"
                :noMargin="true"
                @selected="handleEncodeFpsChange"
              />
            </div>
          </div>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMFullTabWrapper from "@/components/TMFullTabWrapper.vue";
import TMCimbarEncodeHelp from "@/views/helps/TMCimbarEncodeHelp.vue";
import {
  createCimbarEncodeWorker,
  getCimbarAssets,
  getCimbarMd5Url,
} from "@/common/cimbar/TMCimbarWorkerClient.js";

const MAX_INPUT_BYTES = 33 * 1024 * 1024;
const WASM_READY_TIMEOUT_MS = 30000;

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${
    units[index]
  }`;
}

export default {
  extends: TMToolBase,
  name: "TMCimbarEncode",
  components: {
    TMSubSidebar,
    TMFullTabWrapper,
    TMCimbarEncodeHelp,
  },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.CimbarConfigLayout,
      currentConfigLayout: {
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        isShowSidebar: true,
        sourceType: "text",
        textFileName: "text.txt",
        encodeMode: 68,
        encodeFps: 15,
      },

      firstSectionSize: 40,
      secondSectionSize: 60,

      textSource: "",
      selectedFile: null,

      encodeProgress: 0,
      encodeMd5: "",
      isPreparing: false,
      isEncoding: false,
      isFullTab: false,
      canvasAspect: 1,

      encodeWorker: null,
      encoderReady: false,
      encoderInitPromise: null,
    };
  },

  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Help,
        label: this.$t("i18nCommon.sidebarOption.help"),
        icon: "tm-help-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      return options;
    },
    sourceOptions() {
      return [
        {
          value: "text",
          label: this.$t("i18nCommon.cimbar.encode.sourceText"),
        },
        {
          value: "file",
          label: this.$t("i18nCommon.cimbar.encode.sourceFile"),
        },
      ];
    },
    encodeModeOptions() {
      return [
        { value: 68, label: this.$t("i18nCommon.cimbar.mode.b") },
        { value: 67, label: this.$t("i18nCommon.cimbar.mode.bm") },
        { value: 66, label: this.$t("i18nCommon.cimbar.mode.bu") },
        { value: 4, label: this.$t("i18nCommon.cimbar.mode.c4") },
      ];
    },
    fpsOptions() {
      return [5, 10, 15, 20, 30].map((fps) => ({
        value: fps,
        label: `${fps} fps`,
      }));
    },
    canStartEncode() {
      return this.currentConfigLayout.sourceType === "text"
        ? !!this.textSource.trim()
        : !!this.selectedFile;
    },
    selectedFileInfo() {
      if (!this.selectedFile) {
        return "";
      }
      return `${this.selectedFile.name} · ${formatBytes(this.selectedFile.size)}`;
    },
    sourceSummary() {
      if (this.currentConfigLayout.sourceType === "text") {
        return `${this.$t("i18nCommon.cimbar.encode.sourceText")} · ${this.$t(
          "i18nCommon.cimbar.encode.charCount",
        ).format(this.textSource ? this.textSource.length : 0)}`;
      }
      return this.selectedFile
        ? this.selectedFileInfo
        : this.$t("i18nCommon.cimbar.encode.noFile");
    },
    firstSectionResizeStyle() {
      return { height: `${this.firstSectionSize}%` };
    },
    secondSectionResizeStyle() {
      return { height: `${this.secondSectionSize}%` };
    },
    isFileSource() {
      return this.currentConfigLayout.sourceType === "file";
    },
    /**
     * Chưa encode xong thì không hiện khu vực kết quả (canvas) để giao diện
     * tối giản; canvas vẫn được render (v-show) vì cần transfer sang worker
     * OffscreenCanvas ngay khi bấm Bắt đầu.
     */
    showResult() {
      return this.isEncoding;
    },
    /**
     * Text: vùng nhập chiếm firstSectionSize% (kéo resizer được).
     * File: ô upload chỉ cao 1 dòng → để vùng nhập tự co theo nội dung,
     * nhường toàn bộ phần còn lại cho khu vực kết quả.
     * Khi chưa có kết quả: vùng nhập chiếm hết chỗ trống.
     */
    inputSectionStyle() {
      if (!this.showResult) {
        return this.isFileSource ? { height: "auto" } : { height: "100%" };
      }
      return this.isFileSource ? {} : this.firstSectionResizeStyle;
    },
    resultSectionStyle() {
      if (this.isFullTab) {
        return {};
      }
      if (this.isFileSource) {
        return {
          flex: "1 1 auto",
          height: "auto",
          width: "100%",
          minHeight: 0,
        };
      }
      return this.secondSectionResizeStyle;
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.observeCanvasPanel();
      this.applyCanvasSize();
    });
  },

  beforeUnmount() {
    this.disconnectCanvasPanel();
    this.destroyEncodeWorker();
  },

  methods: {
    handleTextSourceChange(value) {
      let me = this;
      me.textSource = value;
      me.encodeMd5 = "";
    },

    handleSourceTypeChange(value) {
      let me = this;
      me.currentConfigLayout.sourceType = value;
      me.encodeMd5 = "";
      me.updateConfigLayout();
    },

    handleEncodeModeChange(value) {
      let me = this;
      me.currentConfigLayout.encodeMode = value;
      if (me.encodeWorker && me.encoderReady && !me.isEncoding) {
        me.encodeWorker.postMessage({ type: "mode", mode: value });
      }
      me.updateConfigLayout();
    },

    handleEncodeFpsChange(value) {
      let me = this;
      me.currentConfigLayout.encodeFps = value;
      if (me.encodeWorker && me.encoderReady) {
        me.encodeWorker.postMessage({ type: "fps", fps: value });
      }
      me.updateConfigLayout();
    },

    handleResize(sizes) {
      this.firstSectionSize = sizes.leftSize;
      this.secondSectionSize = sizes.rightSize;
    },

    toggleFullTab() {
      this.isFullTab = !this.isFullTab;
    },

    getTabLifecycleConfig() {
      let me = this;
      return {
        shortcuts: [],
        domEvents: [{ event: "keydown", handler: me.handleKeydownEvent }],
      };
    },

    handleKeydownEvent(event) {
      let me = this;
      if (event.key === "Escape" && me.isFullTab) {
        me.toggleFullTab();
      }
    },

    async startEncode() {
      let me = this;
      if (me.isPreparing || me.isEncoding) {
        return;
      }
      const source = await me.buildEncodeSource();
      if (!source) {
        return;
      }

      me.isPreparing = true;
      me.encodeProgress = 0;
      me.encodeMd5 = "";
      try {
        await me.ensureEncodeWorker();
        me.encodeWorker.postMessage(
          { type: "load", name: source.name, buffer: source.buffer },
          [source.buffer],
        );
      } catch (error) {
        me.isPreparing = false;
        me.$tmToast.error(
          `${me.$t("i18nCommon.cimbar.errors.encodeStart")} ${
            error && error.message ? error.message : error
          }`,
          5000,
        );
      }
    },

    async buildEncodeSource() {
      let me = this;
      if (me.currentConfigLayout.sourceType === "text") {
        if (!me.textSource) {
          me.$tmToast.warning(me.$t("i18nCommon.cimbar.errors.emptyText"));
          return null;
        }
        const bytes = new TextEncoder().encode(me.textSource);
        if (bytes.byteLength > MAX_INPUT_BYTES) {
          me.$tmToast.error(me.$t("i18nCommon.cimbar.errors.tooLarge"));
          return null;
        }
        const fileName =
          (me.currentConfigLayout.textFileName || "text.txt").trim() ||
          "text.txt";
        return { name: fileName, buffer: bytes.buffer };
      }

      if (!me.selectedFile) {
        me.$tmToast.warning(me.$t("i18nCommon.cimbar.errors.noFile"));
        return null;
      }
      if (me.selectedFile.size > MAX_INPUT_BYTES) {
        me.$tmToast.error(me.$t("i18nCommon.cimbar.errors.tooLarge"));
        return null;
      }
      const buffer = await me.selectedFile.arrayBuffer();
      return {
        name: me.selectedFile.name || "data.bin",
        buffer: buffer,
      };
    },

    ensureEncodeWorker() {
      let me = this;
      if (me.encoderReady) {
        return Promise.resolve();
      }
      if (me.encoderInitPromise) {
        return me.encoderInitPromise;
      }

      const canvas = me.$refs.encodeCanvas;
      if (!canvas || typeof canvas.transferControlToOffscreen !== "function") {
        return Promise.reject(
          new Error(me.$t("i18nCommon.cimbar.errors.offscreenUnsupported")),
        );
      }

      const offscreen = canvas.transferControlToOffscreen();
      const worker = createCimbarEncodeWorker();
      me.encodeWorker = worker;
      worker.onmessage = me.onEncodeWorkerMessage;
      worker.onerror = me.onEncodeWorkerError;

      const assets = getCimbarAssets();
      const initPromise = new Promise((resolve, reject) => {
        me._encoderReadyResolve = resolve;
        me._encoderReadyReject = reject;
        me._encoderReadyTimer = setTimeout(() => {
          reject(new Error(me.$t("i18nCommon.cimbar.errors.wasmTimeout")));
        }, WASM_READY_TIMEOUT_MS);

        worker.postMessage(
          {
            type: "init",
            canvas: offscreen,
            glueUrl: assets.glueUrl,
            wasmUrl: assets.wasmUrl,
            md5Url: getCimbarMd5Url(),
            mode: me.currentConfigLayout.encodeMode,
          },
          [offscreen],
        );
      });

      // Init lỗi/timeout thì phải dọn worker + promise để lần bấm sau còn thử
      // lại được (canvas đã transferControlToOffscreen nên phải tạo canvas mới).
      me.encoderInitPromise = initPromise.catch((error) => {
        me.encoderInitPromise = null;
        me._encoderReadyResolve = null;
        me._encoderReadyReject = null;
        if (me._encoderReadyTimer) {
          clearTimeout(me._encoderReadyTimer);
          me._encoderReadyTimer = null;
        }
        me.destroyEncodeWorker();
        me.resetEncodeCanvas();
        throw error;
      });

      return me.encoderInitPromise.then(() => {
        me.encoderReady = true;
      });
    },

    /**
     * Canvas đã bị transferControlToOffscreen() thì không transfer lại được.
     * Tạo canvas mới thay thế để lần encode sau vẫn chạy.
     */
    resetEncodeCanvas() {
      let me = this;
      const oldCanvas = me.$refs.encodeCanvas;
      if (!oldCanvas || !oldCanvas.parentNode) {
        return;
      }
      const fresh = document.createElement("canvas");
      fresh.className = oldCanvas.className;
      fresh.width = 1024;
      fresh.height = 1024;
      fresh.style.width = oldCanvas.style.width;
      fresh.style.height = oldCanvas.style.height;
      oldCanvas.parentNode.replaceChild(fresh, oldCanvas);
      me.$nextTick(() => me.applyCanvasSize());
    },

    onEncodeWorkerMessage(event) {
      let me = this;
      const data = event.data || {};
      switch (data.type) {
        case "ready": {
          if (me._encoderReadyTimer) {
            clearTimeout(me._encoderReadyTimer);
            me._encoderReadyTimer = null;
          }
          me.encoderReady = true;
          me.canvasAspect = data.aspect || 1;
          me.$nextTick(() => me.applyCanvasSize());
          if (me._encoderReadyResolve) {
            me._encoderReadyResolve();
            me._encoderReadyResolve = null;
            me._encoderReadyReject = null;
          }
          break;
        }
        case "progress":
          me.encodeProgress = data.percent || 0;
          break;
        case "loaded":
          me.isPreparing = false;
          me.isEncoding = true;
          me.encodeMd5 = data.md5 || "";
          me.$nextTick(() => me.applyCanvasSize());
          break;
        case "aspect":
          me.canvasAspect = data.aspect || 1;
          me.$nextTick(() => me.applyCanvasSize());
          break;
        case "stopped":
          me.finishEncoding();
          break;
        case "error": {
          const message = data.message || "";
          if (!me.encoderReady && me._encoderReadyReject) {
            if (me._encoderReadyTimer) {
              clearTimeout(me._encoderReadyTimer);
              me._encoderReadyTimer = null;
            }
            me._encoderReadyReject(new Error(message));
            me._encoderReadyReject = null;
            me._encoderReadyResolve = null;
            me.encoderInitPromise = null;
          } else {
            me.finishEncoding();
            me.$tmToast.error(message, 5000);
          }
          break;
        }
        default:
          break;
      }
    },

    onEncodeWorkerError(event) {
      let me = this;
      const message =
        (event && event.message) || me.$t("i18nCommon.cimbar.errors.worker");
      if (!me.encoderReady && me._encoderReadyReject) {
        if (me._encoderReadyTimer) {
          clearTimeout(me._encoderReadyTimer);
          me._encoderReadyTimer = null;
        }
        me._encoderReadyReject(new Error(message));
        me._encoderReadyReject = null;
        me._encoderReadyResolve = null;
        me.encoderInitPromise = null;
      } else {
        me.finishEncoding();
        me.$tmToast.error(message, 5000);
      }
    },

    /**
     * Kết thúc encode (stop/lỗi): ẩn khu vực kết quả và thoát toàn màn hình,
     * vì nút fullscreen bị disable khi không còn encode.
     */
    finishEncoding() {
      this.isPreparing = false;
      this.isEncoding = false;
      this.isFullTab = false;
    },

    stopEncode() {
      let me = this;
      if (me.encodeWorker) {
        me.encodeWorker.postMessage({ type: "stop" });
      }
      me.finishEncoding();
    },

    destroyEncodeWorker() {
      let me = this;
      if (me.encodeWorker) {
        me.encodeWorker.postMessage({ type: "destroy" });
        me.encodeWorker.terminate();
        me.encodeWorker = null;
      }
      me.encoderReady = false;
      me.encoderInitPromise = null;
      if (me._encoderReadyTimer) {
        clearTimeout(me._encoderReadyTimer);
        me._encoderReadyTimer = null;
      }
    },

    handleFileSelected(files) {
      let me = this;
      const file = Array.isArray(files) ? files[0] : files;
      me.selectedFile = file || null;
      me.encodeMd5 = "";
    },

    // ── Canvas sizing ────────────────────────────────────────────────────
    observeCanvasPanel() {
      let me = this;
      const panel = me.$refs.canvasPanel;
      if (!panel || typeof ResizeObserver === "undefined") {
        return;
      }
      me.disconnectCanvasPanel();
      me._resizeObserver = new ResizeObserver(() => me.applyCanvasSize());
      me._resizeObserver.observe(panel);
    },

    disconnectCanvasPanel() {
      let me = this;
      if (me._resizeObserver) {
        me._resizeObserver.disconnect();
        me._resizeObserver = null;
      }
    },

    applyCanvasSize() {
      let me = this;
      const panel = me.$refs.canvasPanel;
      const canvas = me.$refs.encodeCanvas;
      if (!panel || !canvas) {
        return;
      }
      const rect = panel.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }
      const aspect = me.canvasAspect || 1;
      let width = rect.width;
      let height = width / aspect;
      if (height > rect.height) {
        height = rect.height;
        width = height * aspect;
      }
      canvas.style.width = `${Math.max(1, Math.floor(width))}px`;
      canvas.style.height = `${Math.max(1, Math.floor(height))}px`;
    },
  },
};
</script>

<style scoped lang="scss">
.container {
  display: flex;
  width: 100%;
  height: 100%;
}
.main-tool {
  height: 100%;
  width: 100%;
  justify-content: flex-start;
}

.input-section {
  width: 100%;
  justify-content: flex-start;
  align-items: flex-start;
}

.input-area {
  width: 100%;
  height: 100%;
  flex: 1;
  gap: var(--padding);
  min-height: 0;
}

.source-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.source-file {
  align-self: flex-start;
  min-width: 0;
}

.button-generate {
  justify-content: flex-start;
  height: 100%;
  gap: var(--padding);
}

/* Layout upload file: ô chọn file chỉ cao 1 dòng nên nút xếp ngang cho gọn,
   không kéo cao theo vùng nhập. */
.button-generate-row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  height: auto;
}

.group-footer-input {
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: var(--padding);
  margin: var(--padding) 0;
}

.footer-status {
  flex: 1;
  justify-content: flex-start;
  gap: var(--padding);
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
}

.footer-status > span {
  min-width: 0;
}

.generating-status {
  color: var(--text-secondary-color);
  white-space: nowrap;
}

.md5-box {
  justify-content: flex-end;
  gap: var(--padding-medium);
  min-width: 0;
  font-size: var(--font-size-small);
}

.md5-label {
  color: var(--text-secondary-color);
  white-space: nowrap;
}

.md5-value {
  min-width: 0;
  color: var(--text-primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: all;
}

.cimbar-wrapper {
  background: var(--bg-main-color);
}

.canvas-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: var(--bg-layer-color);
  border: var(--border-component-style);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.cimbar-canvas {
  display: block;
  background: var(--bg-layer-color);
  image-rendering: pixelated;
}

.tm-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}

.input-config {
  width: 100%;
  gap: var(--padding);
  .input-config-item {
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 var(--padding);
    box-sizing: border-box;
    gap: var(--padding);
    .title-input-config {
      flex: 1;
      min-width: 0;
    }
    .value-input-config {
      width: 140px;
    }
  }
}
</style>
