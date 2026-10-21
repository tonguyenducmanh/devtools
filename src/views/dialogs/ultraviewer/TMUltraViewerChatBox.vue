<template>
  <!-- KHÔNG dùng class utility "flex flex-col" ở đây: utility .flex đặt
       align-items:center khiến các khối con (danh sách tin, ô nhập) bị co
       theo nội dung thay vì tràn hết bề rộng khung chat. Layout flex cột
       khai báo trong CSS của component. -->
  <div class="tm-chat-box">
    <div v-if="showHeader" class="tm-chat-header">{{ title }}</div>

    <div class="tm-chat-messages">
      <div
        v-for="(entry, idx) in messages"
        :key="idx"
        class="tm-chat-row"
        :class="entry.local ? 'tm-chat-row-local' : 'tm-chat-row-remote'"
      >
        <!-- Thời gian không hiện trực tiếp mà hiện khi rê chuột vào tin nhắn -->
        <div class="tm-chat-bubble" v-tooltip="entry.time">
          <div class="tm-chat-text">{{ entry.text }}</div>
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
        :iconClass="'tm-send-icon'"
        @click="sendMessage"
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
 * `send` khi người dùng bấm nút gửi hoặc Enter. Nhờ vậy cùng một dữ liệu
 * chat có thể hiển thị ở nhiều nơi mà không phải nhân bản logic gửi tin.
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
  emits: ["send"],

  data() {
    return {
      inputText: "",
    };
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
  font-size: var(--font-size-small);
  font-weight: 600;
}

.tm-chat-messages {
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow-y: auto;
  padding: 0 var(--padding);
  display: flex;
  flex-direction: column;
  /* Các dòng tin nhắn phải tràn hết chiều ngang khung chat, nếu không bong
     bóng sẽ bị co lại và chữ xuống dòng. */
  align-items: stretch;
  gap: var(--padding-medium);
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
  font-size: var(--font-size-small);
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
</style>
