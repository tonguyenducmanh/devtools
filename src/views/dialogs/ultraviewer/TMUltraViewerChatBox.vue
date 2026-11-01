<template>
  <!-- KHÔNG dùng class utility "flex flex-col" ở đây: utility .flex đặt
       align-items:center khiến các khối con (danh sách tin, ô nhập) bị co
       theo nội dung thay vì tràn hết bề rộng khung chat. Layout flex cột
       khai báo trong CSS của component. -->
  <div class="tm-chat-box">
    <div v-if="showHeader" class="tm-chat-header">{{ title }}</div>

    <div ref="messagesContainer" class="tm-chat-messages" @scroll="onScroll">
      <div
        v-for="(entry, idx) in messages"
        :key="idx"
        class="tm-chat-row"
        :class="entry.local ? 'tm-chat-row-local' : 'tm-chat-row-remote'"
      >
        <!-- Thời gian không hiện trực tiếp mà hiện khi rê chuột vào tin nhắn -->
        <div class="tm-chat-bubble" v-tooltip="entry.time">
          <template v-if="entry.file">
            <div class="tm-chat-file-name">
              <span class="tm-icon tm-upload-icon"></span>
              <span class="tm-chat-text">{{ entry.file.name }}</span>
            </div>
            <div class="tm-chat-file-size">
              {{ formatSize(entry.file.transferred) }} /
              {{ formatSize(entry.file.size) }}
            </div>
            <!-- Offer từ máy đối tác: chờ mình nhận hay từ chối -->
            <div v-if="entry.file.status === 'offer'" class="tm-chat-file-actions">
              <TMButton
                :noMargin="true"
                :isSmallButton="true"
                :label="$t('i18nCommon.ultraViewer.fileAccept')"
                @click="$emit('file-accept', entry.file.id)"
              />
              <TMButton
                :noMargin="true"
                :isSmallButton="true"
                :type="$tmEnum.buttonType.secondary"
                :label="$t('i18nCommon.ultraViewer.fileDecline')"
                @click="$emit('file-decline', entry.file.id)"
              />
            </div>
            <!-- Đang truyền: thanh tiến độ -->
            <div
              v-else-if="entry.file.status === 'transferring'"
              class="tm-chat-file-progress"
            >
              <div
                class="tm-chat-file-progress-bar"
                :style="{ width: progressPercent(entry.file) + '%' }"
              ></div>
            </div>
            <!-- Xong: nút lưu (file nhận) hoặc nhãn đã gửi -->
            <div v-else class="tm-chat-file-actions">
              <TMButton
                v-if="!entry.local"
                :noMargin="true"
                :isSmallButton="true"
                :iconClass="'tm-download-icon'"
                :label="$t('i18nCommon.ultraViewer.fileSave')"
                @click="$emit('file-save', entry.file.id)"
              />
              <span v-else class="tm-chat-file-note">{{ fileStatusText(entry.file) }}</span>
            </div>
            <div v-if="entry.file.status === 'canceled' || entry.file.status === 'failed'" class="tm-chat-file-note">
              {{ fileStatusText(entry.file) }}
            </div>
          </template>
          <div v-else class="tm-chat-text">{{ entry.text }}</div>
        </div>
      </div>
      <div v-if="isTyping" class="tm-chat-typing">{{ typingText }}</div>
    </div>

    <div v-if="showInput" class="tm-chat-input">
      <TMInput
        v-model="inputText"
        :noMargin="true"
        :readOnly="readOnly"
        :placeHolder="placeHolder"
        @keyup.enter="sendMessage"
      />
      <TMButton
        :noMargin="true"
        :readOnly="readOnly"
        v-tooltip="$t('i18nCommon.ultraViewer.attachFile')"
        :iconClass="'tm-upload-icon'"
        @click="pickFile"
      />
      <TMButton
        :noMargin="true"
        :readOnly="readOnly"
        :iconClass="'tm-send-icon'"
        @click="sendMessage"
      />
      <!-- Input ẩn chọn tệp đính kèm (bấm nút phía trên mới hiện) -->
      <input
        ref="fileInput"
        type="file"
        class="tm-chat-file-input"
        @change="onFilePicked"
      />
    </div>
  </div>
</template>

<script>
/**
 * TMUltraViewerChatBox - khung chat của tool Remote Desktop (UltraViewer).
 *
 * Dùng cho chat trong phiên remote desktop: hiển thị trong sidebar của tool
 * và trong popup nổi (không có nền che) mở từ nút chat trên thanh công cụ.
 *
 * Component KHÔNG tự gửi tin: nhận `messages`/`isTyping` từ ngoài và emit
 * `send` khi người dùng bấm nút gửi hoặc Enter, `attach` khi chọn tệp đính
 * kèm, `file-accept`/`file-decline`/`file-save` khi bấm nút trên bong bóng
 * tệp. Nhờ vậy cùng một dữ liệu chat có thể hiển thị ở nhiều nơi mà không
 * phải nhân bản logic gửi tin.
 */
export default {
  name: "TMUltraViewerChatBox",

  props: {
    /**
     * Danh sách tin nhắn: [{ text, local, time }].
     * local = true nếu do mình gửi, false nếu do máy đối tác gửi.
     */
    messages: {
      type: Array,
      default: () => [],
    },
    /** Máy đối tác đang gõ. */
    isTyping: {
      type: Boolean,
      default: false,
    },
    /** Chặn nhập (ví dụ khi chưa kết nối). */
    readOnly: {
      type: Boolean,
      default: false,
    },
    /** Nội dung ô nhập (đặt tên giống TMInput). */
    placeHolder: {
      type: String,
      default: "",
    },
    /** Tiêu đề khung chat. */
    title: {
      type: String,
      default: "",
    },
    /** Hiện dòng tiêu đề hay không. */
    showHeader: {
      type: Boolean,
      default: true,
    },
    /** Hiện ô nhập hay không. */
    showInput: {
      type: Boolean,
      default: true,
    },
    /** Nội dung hiển thị khi máy đối tác đang gõ. */
    typingText: {
      type: String,
      default: "",
    },
  },
  emits: ["send", "attach", "file-accept", "file-decline", "file-save"],

  data() {
    return {
      inputText: "",
      isPinnedToBottom: true,
    };
  },

  mounted() {
    this.$nextTick(() => {
      this.scrollToBottom();
    });
  },
  watch: {
    messages: {
      handler() {
        if (this.isPinnedToBottom) {
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      },
      deep: true,
    },
    isTyping() {
      if (this.isPinnedToBottom) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
  },
  methods: {
    /**
     * Gửi nội dung đang gõ ra ngoài (component cha lo phần gửi thật).
     */
    sendMessage() {
      const text = this.inputText.trim();
      if (!text) return;
      this.inputText = "";
      this.$emit("send", text);
      this.isPinnedToBottom = true;
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    /** Mở hộp thoại chọn tệp đính kèm. */
    pickFile() {
      if (this.readOnly) return;
      this.$refs.fileInput?.click();
    },
    /** Người dùng đã chọn tệp — đẩy ra ngoài rồi reset input để chọn lại được. */
    onFilePicked(event) {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      this.$emit("attach", file);
      this.isPinnedToBottom = true;
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    /** Dung lượng dạng "12.3 KB". */
    formatSize(bytes) {
      if (bytes == null) return "";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    },
    progressPercent(file) {
      if (!file.size) return 100;
      return Math.min(100, Math.round((file.transferred / file.size) * 100));
    },
    fileStatusText(file) {
      const key = {
        waiting: "i18nCommon.ultraViewer.fileWaitingAccept",
        done: file.local
          ? "i18nCommon.ultraViewer.fileSent"
          : "i18nCommon.ultraViewer.fileReceived",
        canceled: "i18nCommon.ultraViewer.fileCanceled",
        failed: "i18nCommon.ultraViewer.fileFailed",
      }[file.status];
      return key ? this.$t(key) : "";
    },
    onScroll() {
      const container = this.$refs.messagesContainer;
      if (!container) return;
      const threshold = 20;
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      this.isPinnedToBottom = distanceToBottom <= threshold;
    },
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    },
  },
};
</script>

<style scoped lang="scss">
.tm-chat-box {
  display: flex;
  flex-direction: column;
  /* Các khối con phải tràn hết chiều ngang khung chat. */
  align-items: stretch;
  width: 100%;
  height: 100%;
  min-height: 200px;
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.tm-chat-header {
  padding: var(--padding);
  font-weight: 600;
}

.tm-chat-messages {
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow-y: auto;
  padding: var(--padding);
  display: flex;
  flex-direction: column;
  /* Các dòng tin nhắn phải tràn hết chiều ngang khung chat, nếu không bong
     bóng sẽ bị co lại và chữ xuống dòng. */
  align-items: stretch;
  gap: var(--padding-medium);
  user-select: text;
  -webkit-user-select: text;
}

/* Tin của mình bên phải, tin của máy đối tác bên trái */
.tm-chat-row {
  display: flex;
  width: 100%;
}

.tm-chat-row-local {
  justify-content: flex-end;
}

.tm-chat-row-remote {
  justify-content: flex-start;
}

.tm-chat-bubble {
  max-width: 85%;
  /* Bong bóng bám theo nội dung và KHÔNG bị co lại (flex-shrink = 0), nếu
     không tin ngắn sẽ bị bóp lại và chữ xuống dòng. */
  flex: 0 0 auto;
  width: fit-content;
  padding: var(--padding-medium) var(--padding-x-medium);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-component);
  line-height: 1.5;
}

/* Tin của mình viền màu nhấn, tin máy đối tác viền màu trung tính */
.tm-chat-row-local .tm-chat-bubble {
  background-color: var(--focus-color);
  color: var(--selected-item-text-color);
}

.tm-chat-row-remote .tm-chat-bubble {
  border-color: var(--text-secondary-color);
  color: var(--text-primary-color);
}

.tm-chat-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

.tm-chat-typing {
  font-size: var(--font-size-small);
  opacity: 0.6;
  font-style: italic;
}

.tm-chat-input {
  display: flex;
  align-items: center;
  gap: var(--padding);
  padding: var(--padding);
  min-width: 0;

  /* Ô nhập co giãn theo khung, nút gửi giữ nguyên kích thước */
  :deep(.tm-input) {
    flex: 1;
    min-width: 0;
  }

  :deep(.tm-button) {
    flex-shrink: 0;
  }
}

/* Input chọn tệp ẩn hoàn toàn (chỉ tương tác qua nút đính kèm) */
.tm-chat-file-input {
  display: none;
}

.tm-chat-file-name {
  display: flex;
  align-items: center;
  gap: var(--padding-medium);
  min-width: 0;

  .tm-icon {
    flex-shrink: 0;
  }
}

.tm-chat-file-size {
  font-size: var(--font-size-small);
  opacity: 0.75;
  margin-top: var(--padding-medium);
}

.tm-chat-file-actions {
  display: flex;
  align-items: center;
  gap: var(--padding);
  margin-top: var(--padding-medium);
}

.tm-chat-file-progress {
  height: 4px;
  margin-top: var(--padding-medium);
  border-radius: 2px;
  background-color: var(--bg-layer-color);
  overflow: hidden;
}

.tm-chat-file-progress-bar {
  height: 100%;
  background-color: var(--focus-color);
  transition: width 0.2s ease;
}

.tm-chat-file-note {
  font-size: var(--font-size-small);
  opacity: 0.75;
  margin-top: var(--padding-medium);
}
</style>
