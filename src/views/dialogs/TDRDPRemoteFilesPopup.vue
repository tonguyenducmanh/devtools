<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="900px"
    height="440px"
    :title="$t('i18nCommon.remoteDesktop.receiveFiles')"
  >
    <div class="flex flex-col td-remote-files">
      <div class="flex-one td-remote-files-list">
        <div v-if="files.length === 0" class="td-remote-files-empty">
          {{ $t("i18nCommon.remoteDesktop.noFilesFromRemote") }}
        </div>
        <div
          v-for="(file, idx) in files"
          :key="file.remoteIndex"
          class="td-remote-files-item"
          :class="{ 'td-remote-files-item-busy': isFileDownloading(file) }"
          v-tooltip="getFileTooltip(file)"
          @click="downloadFile(idx)"
        >
          <div class="td-icon td-download-icon"></div>
          <div class="flex-one td-remote-files-info">
            <div class="text-nowrap">
              {{ file.path ? file.path + "\\" + file.name : file.name }}
            </div>
            <div class="flex td-remote-files-meta">
              <span class="td-remote-files-size">{{
                formatFileSize(file.size)
              }}</span>
              <span
                v-if="isFileDownloading(file)"
                class="td-remote-files-progress text-nowrap"
              >
                {{ formatFileProgress(file) }}
              </span>
            </div>
            <progress
              v-if="isFileDownloading(file)"
              class="td-remote-files-progress-bar"
              :value="progressValue(file)"
              :max="file.totalSize || 1"
            ></progress>
          </div>
          <button
            class="td-remote-files-remove"
            v-tooltip="$t('i18nCommon.remoteDesktop.removeFile')"
            @click.stop="removeFile(idx)"
          >
            <div class="td-icon td-close-icon"></div>
          </button>
        </div>
      </div>
      <div class="flex td-remote-files-footer">
        <TDButton
          :noMargin="true"
          :readOnly="files.length === 0"
          :label="$t('i18nCommon.remoteDesktop.downloadAll')"
          @click="downloadAll"
        />
        <TDButton
          :noMargin="true"
          :type="$tdEnum.buttonType.secondary"
          :readOnly="files.length === 0"
          :label="$t('i18nCommon.remoteDesktop.clearFileList')"
          @click="clearAll"
        />
      </div>
    </div>
  </TDPopup>
</template>

<script>
/**
 * Danh sách file máy remote gửi sang.
 *
 * Bấm vào 1 dòng để tải đúng file đó, bấm "Tải tất cả" để tải cả danh sách.
 * File đã tải vẫn nẫm lại cho tới khi người dùng bấm xoá.
 * Danh sách do TDRemoteDesktopRDP.vue sở hữu và đưa vào qua show(); mọi thao tác
 * đều gọi ngược về cha để cha giữ quyền sở hữu state.
 */
export default {
  name: "TDRDPRemoteFilesPopup",

  props: {
    ownerForm: {
      type: Object,
      required: false,
      default: null,
    },
  },

  data() {
    return {
      getFiles: null,
      onDialogClosed: null,
      onDownloadFile: null,
      onDownloadAllFiles: null,
      onRemoveFile: null,
      onClearFiles: null,
    };
  },

  computed: {
    /**
     * Đọc trực tiếp từ cha mỗi lần render thay vì giữ tham chiếu mảng lúc mở.
     * Nếu giữ tham chiếu, mỗi lần cha gán lại incomingFiles (remote gửi file mới,
     * hoặc xoá cả danh sách) popup sẽ hiển thị dữ liệu cũ.
     */
    files() {
      return typeof this.getFiles === "function" ? this.getFiles() : [];
    },
  },

  beforeUnmount() {
    // Bắt mọi cách đóng (nút X, bấm nền, phím Esc, đóng bằng code) vì không
    // đường nào chắc chắn đều đi qua callback. Chỉ báo lại trạng thái, không
    // đụng danh sách file.
    if (typeof this.onDialogClosed === "function") {
      this.onDialogClosed();
    }
  },

  methods: {
    show(param) {
      if (!param) return;
      this.getFiles = param.getFiles || null;
      this.onDialogClosed = param.onDialogClosed || null;
      this.onDownloadFile = param.onDownloadFile || null;
      this.onDownloadAllFiles = param.onDownloadAllFiles || null;
      this.onRemoveFile = param.onRemoveFile || null;
      this.onClearFiles = param.onClearFiles || null;
    },

    handleClose() {
      this.$emit("close");
    },

    downloadFile(index) {
      if (typeof this.onDownloadFile === "function") {
        this.onDownloadFile(index);
      }
    },

    downloadAll() {
      if (typeof this.onDownloadAllFiles === "function") {
        this.onDownloadAllFiles();
      }
    },

    removeFile(index) {
      if (typeof this.onRemoveFile === "function") {
        this.onRemoveFile(index);
      }
    },

    clearAll() {
      if (typeof this.onClearFiles === "function") {
        this.onClearFiles();
      }
    },

    isFileDownloading(file) {
      return !!(file && file.downloading);
    },

    getFileTooltip(file) {
      return this.isFileDownloading(file)
        ? this.$t("i18nCommon.remoteDesktop.fileDownloading")
        : this.$t("i18nCommon.remoteDesktop.downloadThisFile");
    },

    /**
     * Value cho thẻ <progress>. Chưa biết tổng dung lượng (đang chờ trả lời
     * SIZE) thì trả undefined để Vue gỡ hẳn attribute value: chỉ khi thiếu
     * value thì <progress> mới chạy kiểu không xác định, còn value="0" max="0"
     * là determinate và sẽ đứng chết ở 0%.
     */
    progressValue(source) {
      return source?.totalSize ? source.receivedBytes : undefined;
    },

    /**
     * "45% · 120.0 MB / 265.4 MB". Chưa biết tổng dung lượng (đang chờ trả lời
     * SIZE) thì để trống, thanh <progress> tự chạy kiểu không xác định.
     *
     * Phần trăm tính lúc render từ receivedBytes/totalSize thay vì lưu vào file,
     * không phải ghi thêm field mỗi lần có chunk về.
     */
    formatFileProgress(file) {
      if (!file || !file.totalSize) return "";
      let percent = Math.floor((file.receivedBytes / file.totalSize) * 100);
      return `${percent}% · ${this.formatFileSize(
        file.receivedBytes,
      )} / ${this.formatFileSize(file.totalSize)}`;
    },

    formatFileSize(bytes) {
      if (!bytes) return "0 B";
      let units = ["B", "KB", "MB", "GB", "TB"];
      let i = Math.floor(Math.log(bytes) / Math.log(1024));
      return (
        (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i]
      );
    },
  },
};
</script>

<style scoped lang="scss">
.td-remote-files {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.td-remote-files-list {
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: var(--padding);
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}

/* Dòng file theo mẫu .otp-item của TDOneTimePassword: nền trong suốt, viền
   mỏng. Tên file không in đậm, phân cấp thị giác đến từ dòng phụ nhỏ hơn và
   màu secondary, giống .td-connection-name của chính tool RDP. */
.td-remote-files-item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  padding: var(--padding);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);

    .td-remote-files-size,
    .td-remote-files-progress {
      color: var(--selected-item-text-color);
    }
  }
}

/* File đang tải thì không bấm lại được nữa, trỏ chuột cũng không cần là con trỏ tay */
.td-remote-files-item-busy {
  cursor: default;

  &:hover {
    background-color: transparent;
    color: inherit;

    .td-remote-files-size {
      color: var(--text-secondary-color);
    }

    .td-remote-files-progress {
      color: var(--focus-color);
    }
  }
}

.td-remote-files-info {
  min-width: 0;
}

/* Dòng dưới: dung lượng bên trái, tiến trình đã tải / tổng bên phải */
.td-remote-files-meta {
  justify-content: space-between;
  gap: var(--padding);
  font-size: var(--font-size-small);
}

.td-remote-files-size {
  color: var(--text-secondary-color);
}

.td-remote-files-progress {
  color: var(--focus-color);
}

/* Thanh tiến trình dùng thẻ <progress> native, giống hệt phần progress của
   TDOneTimePassword nên không cần vẽ tay, không cần cả keyframes. */
.td-remote-files-progress-bar {
  width: 100%;
  height: var(--padding);
  margin-top: var(--padding-medium);
  border: none;
  border-radius: var(--border-radius-component);
  appearance: none;
  overflow: hidden;

  &::-webkit-progress-bar {
    background-color: var(--bg-layer-color);
    border-radius: var(--border-radius-component);
  }

  &::-webkit-progress-value {
    background-color: var(--focus-color);
    border-radius: var(--border-radius-component);
  }

  &::-moz-progress-bar {
    background-color: var(--focus-color);
    border-radius: var(--border-radius-component);
  }
}

.td-remote-files-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--padding-medium);
  border-radius: var(--border-radius-component);
  opacity: 0.6;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }
}

.td-remote-files-empty {
  padding: var(--padding-large) var(--padding);
  text-align: center;
  color: var(--text-secondary-color);
}

.td-remote-files-footer {
  width: 100%;
  justify-content: space-between;
  gap: var(--padding);
  padding: var(--padding);
  border-top: 1px solid var(--border-color);
}
</style>
