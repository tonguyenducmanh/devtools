<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    :showFullScreenHeaderIcon="false"
    :showOverlayBackground="false"
    width="360px"
    height="450px"
    :title="title"
    @close="handleClose"
  >
    <TMUltraViewerChatBox
      class="tm-uv-chat-popup-body"
      :messages="messages"
      :isTyping="isTyping"
      :readOnly="readOnly"
      :placeHolder="placeHolder"
      :typingText="typingText"
      :title="title"
      :showHeader="false"
      @send="handleSend"
    />
  </TMPopup>
</template>

<script>
import TMPopup from "@/components/TMPopup.vue";
import TMUltraViewerChatBox from "@/views/dialogs/ultraviewer/TMUltraViewerChatBox.vue";

/**
 * TMUltraViewerChatPopup - popup chat nổi của tool Remote Desktop (UltraViewer).
 *
 * Đặc biệt: popup KHÔNG có lớp nền mờ che màn hình và không chặn thao tác
 * chuột xuống phía dưới, nên người dùng vẫn xem/thao tác màn hình từ xa được
 * trong lúc mở khung chat. Đây là kiểu popup "không nền che" (showOverlayBackground
 * = false của TMPopup).
 *
 * Dữ liệu chat do tool cha sở hữu và truyền vào qua prop `chatState` (object
 * reactive dùng chung) nên tin nhắn mới vẫn hiện ngay khi đang mở popup.
 */
export default {
  name: "TMUltraViewerChatPopup",
  components: {
    TMPopup,
    TMUltraViewerChatBox,
  },
  props: {
    ownerForm: {
      type: Object,
      required: true,
    },
    /**
     * Object reactive dùng chung với tool cha:
     * { messages: [], isTyping: false, readOnly: true }.
     */
    chatState: {
      type: Object,
      default: () => ({ messages: [], isTyping: false, readOnly: true }),
    },
    /** Hàm gửi tin nhắn (do tool cha cung cấp). */
    onSend: {
      type: Function,
      default: null,
    },
  },
  emits: ["close"],

  data() {
    return {
      title: "",
      placeHolder: "",
      typingText: "",
    };
  },

  computed: {
    messages() {
      return this.chatState?.messages ?? [];
    },
    isTyping() {
      return !!this.chatState?.isTyping;
    },
    /** Ô nhập bị khoá khi chưa kết nối (lấy từ chatState để luôn khớp). */
    readOnly() {
      return !!this.chatState?.readOnly;
    },
  },

  methods: {
    /**
     * Được gọi từ TMDialogUtil ngay sau khi mount.
     * @param {Object} param { title, placeHolder, typingText }
     */
    show(param = {}) {
      this.title = param.title ?? "";
      this.placeHolder = param.placeHolder ?? "";
      this.typingText = param.typingText ?? "";
    },

    handleSend(text) {
      if (this.onSend) {
        this.onSend(text);
      }
    },

    handleClose() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped lang="scss">
.tm-uv-chat-popup-body {
  height: 100%;
  min-height: 0;
}
</style>
