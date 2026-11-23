import { registerPgsqlFormatProvider } from "@/monarch/pgsql/pgsqlFormatProvider.js";
import _ from "@/common/TMCommonFunction.js";

/**
 * Phần dùng chung của các tool "văn bản trống" (thường và Markdown).
 * Đặt trong thư mục views/tools vì đây là nghiệp vụ riêng của nhóm tool này,
 * không phải logic dùng chung của toàn app (Luật 19).
 */
export default {
  created() {
    this.debouncedSaveToHistory = _.debounce(this.saveToHistory, 3000);
  },
  beforeUnmount() {
    if (this.debouncedSaveToHistory?.cancel) {
      this.debouncedSaveToHistory.cancel();
    }
    this.saveToHistory();
  },
  data() {
    return {
      content: "",
    };
  },
  watch: {
    content(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.content);
        if (!this._isApplyingHistory) {
          this.debouncedSaveToHistory();
        }
      }
    },
  },
  computed: {
    monacoOptions() {
      return {
        onInit: (editor, monacoInstance) => {
          registerPgsqlFormatProvider(monacoInstance);
        },
      };
    },
  },
  methods: {
    handleCopy() {
      let me = this;
      if (me.content) {
        me.$tmUtility.copyToClipboard(me.content);
      }
    },
    handleDownload() {
      let me = this;
      if (me.content) {
        let extension = me.getFileExtension(me.currentConfigLayout.language);
        let blob = new Blob([me.content], { type: "text/plain" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = `text-editor.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        me.saveToHistory();
      }
    },
    /**
     * Đọc file văn bản do user chọn rồi đưa vào editor (preview tự cập nhật
     * qua v-model). Tool con có thể khai báo uploadFilePattern và
     * uploadFileErrorKey trong data() nếu muốn giới hạn đuôi file.
     */
    async handleFileUpload(files) {
      let me = this;
      try {
        if (!files || files.length === 0) return;
        let file = files[0];
        if (me.uploadFilePattern && !me.uploadFilePattern.test(file.name)) {
          me.$tmToast.error(
            me.$t(me.uploadFileErrorKey || "i18nCommon.toastMessage.error"),
          );
          return;
        }
        let text = await file.text();
        me.content = text;
        // Gán qua v-model không phát change từ editor → giữ history đồng bộ.
        me._latestEditorValue = text;
        me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Text file upload error:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    /**
     * Lắng nghe sự kiện change từ TMTextEditor khi user đang gõ.
     * Chỉ reset debounce lưu history, không ghi ngược lại editor.
     */
    handleEditorChange(value) {
      let me = this;
      me._latestEditorValue = value;
      if (!me._isApplyingHistory) {
        me.debouncedSaveToHistory();
      }
    },
    /**
     * Lưu nội dung hiện tại vào lịch sử.
     */
    async saveToHistory() {
      let me = this;
      let contentToSave =
        me._latestEditorValue != null ? me._latestEditorValue : me.content;
      if (me.$refs.history && contentToSave) {
        let historyItem = {
          content: contentToSave,
          language: me.currentConfigLayout.language,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    /**
     * Áp dụng nội dung từ lịch sử.
     */
    handleApplyHistory(item) {
      let me = this;
      if (item && item.content) {
        me._isApplyingHistory = true;
        me.content = item.content;
        if (item.language) {
          me.currentConfigLayout.language = item.language;
        }
        me.updateConfigLayout();
        me.$nextTick(() => {
          me._isApplyingHistory = false;
        });
      }
    },
    getFileExtension(language) {
      let extensionMap = {
        javascript: "js",
        typescript: "ts",
        json: "json",
        xml: "xml",
        html: "html",
        css: "css",
        scss: "scss",
        sql: "sql",
        pgsql: "sql",
        mysql: "sql",
        csharp: "cs",
        go: "go",
        rust: "rs",
        python: "py",
        php: "php",
        ruby: "rb",
        swift: "swift",
        kotlin: "kt",
        shell: "sh",
        powershell: "ps1",
        dockerfile: "dockerfile",
        yaml: "yaml",
        markdown: "md",
        ini: "ini",
        bat: "bat",
        plaintext: "txt",
      };
      return extensionMap[language] || "txt";
    },
  },
};
