<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    @close="handleClose"
    width="600px"
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
          v-tooltip="$t('i18nCommon.remoteDesktop.downloadThisFile')"
          @click="downloadFile(idx)"
        >
          <div class="td-icon td-download-icon"></div>
          <div class="flex-one td-remote-files-info">
            <div class="td-remote-files-name">
              {{ file.path ? file.path + "\\" + file.name : file.name }}
            </div>
            <div class="td-remote-files-meta">
              <span>{{ formatFileSize(file.size) }}</span>
              <span v-if="file.downloaded" class="td-remote-files-done">
                {{ $t("i18nCommon.remoteDesktop.fileDownloaded") }}
              </span>
            </div>
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
      <div class="td-remote-files-footer">
        <div class="flex-one td-remote-files-hint">
          {{ $t("i18nCommon.remoteDesktop.receiveFilesHint") }}
        </div>
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

    formatFileSize(bytes) {
      if (!bytes) return "0 B";
      let units = ["B", "KB", "MB", "GB", "TB"];
      let i = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + units[i];
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
  padding: 8px var(--padding);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.td-remote-files-item {
  display: flex;
  align-items: center;
  gap: var(--padding);
  padding: 6px var(--padding);
  border-radius: var(--border-radius);
  background-color: var(--bg-layer-color);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }
}

.td-remote-files-info {
  min-width: 0;
}

.td-remote-files-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-remote-files-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary-color);
}

/* Cùng màu với phần metadata, để dòng file không đổi giao diện sau khi tải */
.td-remote-files-done {
  color: inherit;
}

.td-remote-files-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: var(--border-radius);
  opacity: 0.6;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background-color: var(--focus-color);
    color: var(--selected-item-text-color);
  }
}

.td-remote-files-empty {
  padding: 32px var(--padding);
  text-align: center;
  color: var(--text-secondary-color);
}

.td-remote-files-footer {
  display: flex;
  align-items: center;
  gap: var(--padding);
  padding: 8px var(--padding);
  border-top: 1px solid var(--border-color);
}

.td-remote-files-hint {
  font-size: 12px;
  color: var(--text-secondary-color);
}
</style>
