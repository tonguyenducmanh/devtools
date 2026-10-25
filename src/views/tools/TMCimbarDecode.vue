<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="flex flex-col qr-section">
        <div class="flex tool-qr-header">
          <div class="flex-one">
            <TMUpload
              ref="videoUpload"
              class="upload-area"
              :labelEmpty="$t('i18nCommon.cimbar.decode.noVideo')"
              :readOnly="isDecoding"
              @selected="handleVideoSelected"
            ></TMUpload>
          </div>
          <TMButton
            :noMargin="true"
            @click="startDecode"
            :readOnly="!videoFile || isDecoding"
            iconClass="tm-send-icon"
            v-tooltip="$t('i18nCommon.cimbar.decode.start')"
          ></TMButton>
          <TMButton
            @click="stopDecode"
            :noMargin="true"
            :type="$tmEnum.buttonType.secondary"
            :readOnly="!isDecoding"
            iconClass="tm-cancel-icon"
            v-tooltip="$t('i18nCommon.cimbar.decode.stop')"
          ></TMButton>
          <TMButton
            @click="copyResult"
            :noMargin="true"
            :type="$tmEnum.buttonType.secondary"
            :readOnly="!decodedFile || !decodedFile.text"
            iconClass="tm-copy-icon"
            v-tooltip="$t('i18nCommon.cimbar.decode.copyText')"
          ></TMButton>
          <TMButton
            @click="downloadDecodedFile"
            :noMargin="true"
            :type="$tmEnum.buttonType.secondary"
            :readOnly="!decodedFile"
            iconClass="tm-download-icon"
            v-tooltip="$t('i18nCommon.cimbar.decode.download')"
          ></TMButton>
        </div>

        <div class="flex group-footer-input">
          <div class="flex footer-status">
            <span class="text-nowrap" :title="videoSummary">{{
              videoSummary
            }}</span>
            <span v-if="isDecoding" class="generating-status">
              {{ $t("i18nCommon.cimbar.decode.decoding") }}
            </span>
          </div>
          <div v-if="decodedFile && decodedFile.md5" class="flex md5-box">
            <span class="md5-label">
              {{ $t("i18nCommon.cimbar.decode.md5") }}
            </span>
            <span class="md5-value" :title="decodedFile.md5">{{
              decodedFile.md5
            }}</span>
          </div>
        </div>

        <div class="flex flex-col response-loading" v-if="isDecoding">
          <div class="scan-progress">
            {{
              $t("i18nCommon.cimbar.decode.progress").format(
                decodeFrames,
                decodeTotalFrames,
              )
            }}
          </div>

          <div v-if="fountainPercent >= 0" class="scan-progress">
            {{
              $t("i18nCommon.cimbar.decode.fountainProgress").format(
                fountainPercent,
              )
            }}
          </div>
          <div class="progress-bar">
            <div
              class="progress-value"
              :style="{ width: decodePercent + '%' }"
            ></div>
          </div>
        </div>

        <!-- Kết quả là file: container canh giữa, nội dung canh trái. -->
        <div
          v-else-if="decodedFile && !decodedFile.text"
          class="flex binary-result"
        >
          <div class="binary-result-info">
            <span class="file-label">{{
              $t("i18nCommon.cimbar.decode.fileName")
            }}</span>
            <span class="file-name text-nowrap" :title="decodedFile.name">{{
              decodedFile.name
            }}</span>
            <span class="file-label">{{
              $t("i18nCommon.cimbar.decode.fileSize")
            }}</span>
            <span class="text-nowrap">{{
              formatBytes(decodedFile.size)
            }}</span>
            <span class="file-label">{{
              $t("i18nCommon.cimbar.decode.fileType")
            }}</span>
            <span class="text-nowrap">{{ fileExtension }}</span>
            <span class="file-label">{{
              $t("i18nCommon.cimbar.decode.decodeTime")
            }}</span>
            <span class="text-nowrap">{{ decodeTimeText }}</span>
            <TMButton
              class="file-download"
              :noMargin="true"
              :label="$t('i18nCommon.cimbar.decode.download')"
              @click="downloadDecodedFile"
            ></TMButton>
          </div>
        </div>

        <TMTextEditor
          v-else
          class="input-area"
          :class="{ 'input-area-result': !!decodedFile }"
          :placeHolder="resultPlaceholder"
          v-model="textOutput"
          :readOnly="true"
        ></TMTextEditor>

        <!--
          Video phải nằm trong DOM và vẫn được render để createImageBitmap()
          lấy được khung hình. Ẩn bằng CSS thay vì display:none.
        -->
        <video
          ref="decodeVideo"
          class="hidden-video"
          muted
          playsinline
          preload="metadata"
        ></video>
      </div>
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
          <TMCimbarDecodeHelp />
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
                $t("i18nCommon.cimbar.decode.mode")
              }}</span>
              <TMComboBox
                v-model="currentConfigLayout.decodeMode"
                :options="decodeModeOptions"
                :readOnly="isDecoding"
                :width="140"
                :noMargin="true"
                @selected="updateConfigLayout"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.cimbar.decode.sampleFps")
              }}</span>
              <TMComboBox
                v-model="currentConfigLayout.sampleFps"
                :options="fpsOptions"
                :readOnly="isDecoding"
                :width="140"
                :noMargin="true"
                @selected="updateConfigLayout"
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
import TMCimbarDecodeHelp from "@/views/helps/TMCimbarDecodeHelp.vue";
import {
  createCimbarDecodeWorker,
  getCimbarAssets,
  getCimbarMd5Url,
} from "@/common/cimbar/TMCimbarWorkerClient.js";

const TEXT_PREVIEW_LIMIT = 2 * 1024 * 1024;
const DECODE_FRAME_TIMEOUT_MS = 20000;
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

function formatDuration(seconds) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "0s";
  }
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return minutes > 0 ? `${minutes}m ${remain}s` : `${remain}s`;
}

/**
 * Chỉ hiện preview text khi dữ liệu thật sự là text (không có byte 0 và
 * tỷ lệ ký tự in được cao). Tránh hiển thị binary dưới dạng text rác.
 */
function tryDecodeText(buffer) {
  const bytes = new Uint8Array(buffer);
  if (!bytes.length || bytes.length > TEXT_PREVIEW_LIMIT) {
    return null;
  }
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      return null;
    }
  }
  let text = null;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    return null;
  }
  if (!text) {
    return null;
  }
  let printable = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13 || code >= 32) {
      printable += 1;
    }
  }
  return printable / text.length >= 0.95 ? text : null;
}

export default {
  extends: TMToolBase,
  name: "TMCimbarDecode",
  components: { TMSubSidebar, TMCimbarDecodeHelp },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.CimbarDecodeConfigLayout,
      currentConfigLayout: {
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        isShowSidebar: true,
        decodeMode: 0,
        sampleFps: 15,
      },

      videoFile: null,
      videoUrl: null,
      videoMeta: {
        width: 0,
        height: 0,
        duration: 0,
      },
      isDecoding: false,
      decodeCancelled: false,
      decodePercent: 0,
      decodeFrames: 0,
      decodeTotalFrames: 0,
      fountainPercent: -1,
      decodeError: "",
      decodeSeconds: null,
      decodedFile: null,
      textOutput: null,
      decodeWorker: null,
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
    encodeModeOptions() {
      return [
        { value: 68, label: this.$t("i18nCommon.cimbar.mode.b") },
        { value: 67, label: this.$t("i18nCommon.cimbar.mode.bm") },
        { value: 66, label: this.$t("i18nCommon.cimbar.mode.bu") },
        { value: 4, label: this.$t("i18nCommon.cimbar.mode.c4") },
      ];
    },
    decodeModeOptions() {
      return [
        { value: 0, label: this.$t("i18nCommon.cimbar.mode.auto") },
        ...this.encodeModeOptions,
      ];
    },
    fpsOptions() {
      return [5, 10, 15, 20, 30].map((fps) => ({
        value: fps,
        label: `${fps} fps`,
      }));
    },
    videoInfo() {
      if (!this.videoMeta.width) {
        return "";
      }
      return `${this.videoMeta.width}×${this.videoMeta.height} · ${formatDuration(
        this.videoMeta.duration,
      )}`;
    },
    videoSummary() {
      if (!this.videoFile) {
        return this.$t("i18nCommon.cimbar.decode.noVideo");
      }
      return this.videoInfo
        ? `${this.videoFile.name} · ${this.videoInfo}`
        : this.videoFile.name;
    },
    resultPlaceholder() {
      return this.decodedFile
        ? this.$t("i18nCommon.cimbar.decode.result")
        : this.$t("i18nCommon.cimbar.decode.idle");
    },
    fileExtension() {
      const name = (this.decodedFile && this.decodedFile.name) || "";
      const dotIndex = name.lastIndexOf(".");
      if (dotIndex <= 0 || dotIndex === name.length - 1) {
        return "-";
      }
      return name.slice(dotIndex + 1);
    },
    decodeTimeText() {
      if (this.decodeSeconds == null) {
        return "-";
      }
      return formatDuration(this.decodeSeconds);
    },
  },

  beforeUnmount() {
    this.stopDecode();
    this.clearDecodedFile();
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
      this.videoUrl = null;
    }
  },

  methods: {
    handleVideoSelected(files) {
      let me = this;
      const file = Array.isArray(files) ? files[0] : files;
      if (!file) {
        return;
      }
      const isVideo =
        (file.type && file.type.startsWith("video/")) ||
        /\.(mp4|webm|mov|m4v|ogv|mkv)$/i.test(file.name || "");
      if (!isVideo) {
        me.$tmToast.warning(me.$t("i18nCommon.cimbar.errors.invalidVideo"));
        return;
      }

      me.stopDecode();
      me.clearDecodedFile();
      me.decodeError = "";
      me.videoFile = file;
      me.videoMeta = { width: 0, height: 0, duration: 0 };

      if (me.videoUrl) {
        URL.revokeObjectURL(me.videoUrl);
      }
      me.videoUrl = URL.createObjectURL(file);

      const video = me.$refs.decodeVideo;
      if (video) {
        video.onloadedmetadata = async () => {
          const duration = await me.resolveVideoDuration(video);
          me.videoMeta = {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: duration,
          };
          try {
            video.currentTime = 0;
          } catch (error) {
            // ignore
          }
        };
        video.onerror = () => {
          me.$tmToast.error(me.$t("i18nCommon.cimbar.errors.videoLoad"));
        };
        video.src = me.videoUrl;
        video.load();
      }
    },

    /**
     * Video quay bằng MediaRecorder (webm) thường không có duration trong
     * metadata: `video.duration` là 0 hoặc Infinity. Đẩy currentTime ra thật
     * xa để trình duyệt tự tính duration, rồi trả về 0 nếu vẫn không biết.
     */
    resolveVideoDuration(video) {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        return Promise.resolve(video.duration);
      }
      return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
          if (settled) {
            return;
          }
          settled = true;
          video.removeEventListener("durationchange", onChange);
          clearTimeout(timer);
          resolve(value);
        };
        const onChange = () => {
          if (Number.isFinite(video.duration) && video.duration > 0) {
            finish(video.duration);
          }
        };
        const timer = setTimeout(() => {
          let duration = 0;
          if (video.seekable && video.seekable.length > 0) {
            duration = video.seekable.end(video.seekable.length - 1);
          }
          finish(Number.isFinite(duration) && duration > 0 ? duration : 0);
        }, 4000);
        video.addEventListener("durationchange", onChange);
        try {
          video.currentTime = 1e7;
        } catch (error) {
          // ignore
        }
      });
    },

    async startDecode() {
      let me = this;
      const video = me.$refs.decodeVideo;
      if (me.isDecoding) {
        return;
      }
      if (!me.videoFile || !video) {
        me.$tmToast.warning(me.$t("i18nCommon.cimbar.errors.noVideo"));
        return;
      }

      const duration = await me.resolveVideoDuration(video);
      if (!duration) {
        me.$tmToast.warning(me.$t("i18nCommon.cimbar.errors.videoDuration"));
        return;
      }
      me.videoMeta = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: duration,
      };

      me.clearDecodedFile();
      me.decodeError = "";
      me.decodeSeconds = null;
      me.decodePercent = 0;
      me.fountainPercent = -1;
      me.decodeFrames = 0;
      me.decodeTotalFrames = Math.max(
        1,
        Math.ceil(duration * me.currentConfigLayout.sampleFps),
      );
      me.decodeCancelled = false;
      me.isDecoding = true;
      me._decodeStartedAt = Date.now();
      video.pause();

      try {
        await me.initDecodeWorker();
        me.runDecodeLoop(duration);
      } catch (error) {
        me.isDecoding = false;
        me.finishDecodeTimer();
        me.raiseDecodeError(
          `${me.$t("i18nCommon.cimbar.errors.decodeStart")} ${
            error && error.message ? error.message : error
          }`,
        );
        me.terminateDecodeWorker();
      }
    },

    initDecodeWorker() {
      let me = this;
      me.terminateDecodeWorker();

      const worker = createCimbarDecodeWorker();
      me.decodeWorker = worker;
      me._decodePending = new Map();
      worker.onmessage = me.onDecodeWorkerMessage;
      worker.onerror = me.onDecodeWorkerError;

      const assets = getCimbarAssets();
      me._decodeReadyPromise = new Promise((resolve, reject) => {
        me._decodeReadyResolve = resolve;
        me._decodeReadyReject = reject;
        me._decodeReadyTimer = setTimeout(() => {
          reject(new Error(me.$t("i18nCommon.cimbar.errors.wasmTimeout")));
        }, WASM_READY_TIMEOUT_MS);
      });

      worker.postMessage({
        type: "init",
        glueUrl: assets.glueUrl,
        wasmUrl: assets.wasmUrl,
        md5Url: getCimbarMd5Url(),
        mode: me.currentConfigLayout.decodeMode,
      });
      return me._decodeReadyPromise;
    },

    onDecodeWorkerMessage(event) {
      let me = this;
      const data = event.data || {};

      if (data.type === "ready") {
        if (me._decodeReadyTimer) {
          clearTimeout(me._decodeReadyTimer);
          me._decodeReadyTimer = null;
        }
        if (me._decodeReadyResolve) {
          me._decodeReadyResolve();
          me._decodeReadyResolve = null;
          me._decodeReadyReject = null;
        }
        return;
      }

      if (data.type === "error") {
        const message =
          data.message || me.$t("i18nCommon.cimbar.errors.worker");
        if (me._decodeReadyReject) {
          if (me._decodeReadyTimer) {
            clearTimeout(me._decodeReadyTimer);
            me._decodeReadyTimer = null;
          }
          me._decodeReadyReject(new Error(message));
          me._decodeReadyReject = null;
          me._decodeReadyResolve = null;
        } else if (me.isDecoding) {
          me.raiseDecodeError(message);
        }
        return;
      }

      if (data.type === "frame-result") {
        const pending = me._decodePending && me._decodePending.get(data.index);
        if (pending) {
          me._decodePending.delete(data.index);
          clearTimeout(pending.timer);
          pending.resolve(data);
        }
      }
    },

    onDecodeWorkerError(event) {
      let me = this;
      const message =
        (event && event.message) || me.$t("i18nCommon.cimbar.errors.worker");
      if (me._decodeReadyReject) {
        if (me._decodeReadyTimer) {
          clearTimeout(me._decodeReadyTimer);
          me._decodeReadyTimer = null;
        }
        me._decodeReadyReject(new Error(message));
        me._decodeReadyReject = null;
        me._decodeReadyResolve = null;
      } else {
        me.raiseDecodeError(message);
      }
    },

    async runDecodeLoop(duration) {
      let me = this;
      const video = me.$refs.decodeVideo;
      const fps = me.currentConfigLayout.sampleFps;
      const totalFrames = Math.max(1, Math.ceil(duration * fps));
      const maxSide = 1920;
      const scale = Math.min(
        1,
        maxSide / Math.max(video.videoWidth, video.videoHeight),
      );
      const targetWidth = Math.max(2, Math.round(video.videoWidth * scale));
      const targetHeight = Math.max(2, Math.round(video.videoHeight * scale));

      let consecutiveErrors = 0;
      try {
        for (let index = 1; index <= totalFrames; index++) {
          if (me.decodeCancelled) {
            break;
          }

          const time = Math.min(
            Math.max(0, (index - 1) / fps),
            Math.max(0, duration - 0.001),
          );
          await me.seekVideo(video, time);
          if (me.decodeCancelled) {
            break;
          }

          let bitmap = null;
          try {
            bitmap = await createImageBitmap(video, {
              resizeWidth: targetWidth,
              resizeHeight: targetHeight,
              resizeQuality: "high",
            });
          } catch (error) {
            try {
              bitmap = await createImageBitmap(video);
            } catch (fallbackError) {
              // Video chưa decode xong frame hoặc codec không đọc được.
              me.raiseDecodeError(
                me.$t("i18nCommon.cimbar.errors.frameCapture"),
              );
              break;
            }
          }

          const result = await me.sendFrameToDecoder(bitmap, index);
          me.decodeFrames = index;
          me.decodePercent = Math.round((index / totalFrames) * 100);

          if (!result || result.status === "cancelled") {
            break;
          }
          if (result.status === "error" || result.status === "timeout") {
            consecutiveErrors += 1;
            if (consecutiveErrors >= 5) {
              me.raiseDecodeError(
                result.error || me.$t("i18nCommon.cimbar.errors.decodeFailed"),
              );
              break;
            }
            continue;
          }
          consecutiveErrors = 0;

          me.updateFountainProgress(result.report);

          if (result.status === "done" && result.file) {
            me.handleDecodedFile(result.file);
            break;
          }
        }

        if (!me.decodeCancelled && !me.decodedFile && !me.decodeError) {
          me.raiseDecodeError(me.$t("i18nCommon.cimbar.errors.decodeFailed"));
        }
      } finally {
        me.isDecoding = false;
        me.finishDecodeTimer();
        me.terminateDecodeWorker();
      }
    },

    seekVideo(video, time) {
      return new Promise((resolve) => {
        if (
          Math.abs(video.currentTime - time) < 0.0005 &&
          video.readyState >= 2
        ) {
          resolve();
          return;
        }
        let finished = false;
        const finish = () => {
          if (finished) {
            return;
          }
          finished = true;
          video.removeEventListener("seeked", finish);
          clearTimeout(timer);
          resolve();
        };
        const timer = setTimeout(finish, 3000);
        video.addEventListener("seeked", finish, { once: true });
        try {
          video.currentTime = time;
        } catch (error) {
          finish();
        }
      });
    },

    sendFrameToDecoder(bitmap, index) {
      let me = this;
      return new Promise((resolve) => {
        if (!me.decodeWorker || me.decodeCancelled) {
          try {
            bitmap.close();
          } catch (error) {
            // ignore
          }
          resolve({ status: "cancelled" });
          return;
        }

        const timer = setTimeout(() => {
          me._decodePending.delete(index);
          try {
            bitmap.close();
          } catch (error) {
            // ignore
          }
          resolve({ status: "timeout" });
        }, DECODE_FRAME_TIMEOUT_MS);

        me._decodePending.set(index, { resolve, timer });

        try {
          me.decodeWorker.postMessage(
            {
              type: "frame",
              index: index,
              bitmap: bitmap,
              width: bitmap.width,
              height: bitmap.height,
            },
            [bitmap],
          );
        } catch (error) {
          clearTimeout(timer);
          me._decodePending.delete(index);
          try {
            bitmap.close();
          } catch (closeError) {
            // ignore
          }
          resolve({ status: "error", error: String(error) });
        }
      });
    },

    updateFountainProgress(report) {
      let me = this;
      if (!Array.isArray(report) || !report.length) {
        return;
      }
      const max = Math.max(...report.map((value) => Number(value) || 0));
      me.fountainPercent = Math.max(0, Math.min(100, Math.round(max * 100)));
    },

    /** Chốt thời gian giải mã (giây) để hiển thị trong kết quả. */
    finishDecodeTimer() {
      let me = this;
      if (!me._decodeStartedAt) {
        return;
      }
      me.decodeSeconds = (Date.now() - me._decodeStartedAt) / 1000;
      me._decodeStartedAt = null;
    },

    /**
     * Lỗi giải mã báo bằng toast thay vì chiếm chỗ trong layout.
     * Vẫn lưu decodeError để vòng lặp biết đã báo (tránh toast lặp).
     */
    raiseDecodeError(message) {
      let me = this;
      if (me.decodeError === message) {
        return;
      }
      me.decodeError = message;
      me.$tmToast.error(message, 5000);
    },

    handleDecodedFile(file) {
      let me = this;
      const blob = new Blob([file.buffer], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      me.clearDecodedFile();
      const text = tryDecodeText(file.buffer);
      me.decodedFile = {
        name: file.name || "cimbar-file.bin",
        size: blob.size,
        url: url,
        md5: file.md5 || "",
        text: text,
      };
      me.textOutput = text;
      me.fountainPercent = 100;
      me.$tmToast.success(me.$t("i18nCommon.cimbar.decode.decodeSuccess"));
    },

    downloadDecodedFile() {
      let me = this;
      if (!me.decodedFile) {
        return;
      }
      const link = document.createElement("a");
      link.href = me.decodedFile.url;
      link.download = me.decodedFile.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },

    copyResult() {
      let me = this;
      if (me.textOutput) {
        me.$tmUtility.copyToClipboard(me.textOutput);
      }
    },

    clearDecodedFile() {
      let me = this;
      if (me.decodedFile && me.decodedFile.url) {
        URL.revokeObjectURL(me.decodedFile.url);
      }
      me.decodedFile = null;
      me.textOutput = null;
    },

    stopDecode() {
      let me = this;
      me.decodeCancelled = true;
      const video = me.$refs.decodeVideo;
      if (video) {
        video.pause();
      }
      me.terminateDecodeWorker();
      me.isDecoding = false;
    },

    terminateDecodeWorker() {
      let me = this;
      if (me._decodeReadyTimer) {
        clearTimeout(me._decodeReadyTimer);
        me._decodeReadyTimer = null;
      }
      me._decodeReadyResolve = null;
      me._decodeReadyReject = null;

      if (me.decodeWorker) {
        me.decodeWorker.terminate();
        me.decodeWorker = null;
      }
      if (me._decodePending) {
        for (const pending of me._decodePending.values()) {
          clearTimeout(pending.timer);
          pending.resolve({ status: "cancelled" });
        }
        me._decodePending.clear();
      }
    },

    formatBytes(bytes) {
      return formatBytes(bytes);
    },
  },
};
</script>

<style scoped>
.container {
  height: 100%;
}
.qr-section {
  flex: 1;
  width: 100%;
  height: 100%;
  gap: var(--padding);
  min-height: 0;
}

.input-area {
  flex: 1;
  min-height: 0;
}
/* Có kết quả text thì khoanh vùng kết quả bằng màu focus. */
.input-area-result {
  box-sizing: border-box;
  border: 1px solid var(--focus-color);
  border-radius: var(--border-radius);
}
.main-tool {
  flex: 1;
  height: 100%;
  min-width: 0;
}
.tm-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}
.tool-qr-header {
  width: 100%;
  justify-content: space-between;
  gap: var(--padding);
}
.response-loading {
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: var(--padding);
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
}
.scan-progress {
  white-space: nowrap;
}
.group-footer-input {
  width: 100%;
  justify-content: space-between;
  align-items: center;
  gap: var(--padding);
}
.footer-status {
  flex: 1;
  justify-content: flex-start;
  gap: var(--padding);
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-small);
}
.footer-status > span {
  min-width: 0;
}
.generating-status {
  white-space: nowrap;
}
.md5-box {
  justify-content: flex-end;
  gap: var(--padding-medium);
  min-width: 0;
  font-size: var(--font-size-small);
}
.md5-label {
  white-space: nowrap;
}
.md5-value {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: all;
}
.progress-bar {
  width: 100%;
  max-width: 480px;
  height: 8px;
  border-radius: 999px;
  background: var(--bg-layer-color);
  overflow: hidden;
}
.progress-value {
  height: 100%;
  background: var(--btn-primary-bg);
  transition: width 0.15s linear;
}
.binary-result {
  flex: 1;
  width: 100%;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: var(--padding);
}
/* Card phẳng: viền nhẹ, không bóng đổ; nhãn/giá trị căn theo baseline. */
.binary-result-info {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--padding-large);
  row-gap: var(--padding-x-medium);
  max-width: 100%;
  padding: var(--padding-large);
  line-height: 1.6;
  background-color: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: none;
}
.file-label {
  white-space: nowrap;
}
.file-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-download {
  grid-column: 1 / -1;
  justify-self: start;
  align-self: start;
  margin-top: var(--padding-medium);
}
/* Nút phẳng: không bóng đổ, chuyển trạng thái mượt. */
.binary-result-info :deep(.file-download) {
  box-shadow: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}
.input-config {
  width: 100%;
  gap: var(--padding);
}
.input-config .input-config-item {
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 var(--padding);
  box-sizing: border-box;
  gap: var(--padding);
}
.input-config .input-config-item .title-input-config {
  flex: 1;
  min-width: 0;
}
.input-config .input-config-item .value-input-config {
  width: 140px;
}
.hidden-video {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 2px;
  opacity: 0.01;
  pointer-events: none;
  overflow: hidden;
}
</style>
