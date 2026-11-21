<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    isFullPopup
    :title="previewLabel"
    @close="handleClose"
  >
    <template #header>
      <!-- Cùng mẫu với nút fullscreen/close sẵn có của TMPopup. Class
           tm-popup-close còn giúp startDrag() bỏ qua nút này. -->
      <button
        v-if="renderMarkdown"
        class="tm-popup-close"
        v-tooltip="$t('i18nCommon.apiTesting.copyAIDocs')"
        @click="handleCopyContent"
      >
        <div class="tm-icon tm-copy-icon"></div>
      </button>
    </template>
    <div class="tm-preview-editor">
      <TMMarkdownViewer v-if="renderMarkdown" :source="previewValue" />
      <TMTextEditor
        v-else
        :modelValue="previewValue"
        :readOnly="true"
        :enableHighlight="true"
        :language="previewLanguage"
      />
    </div>
  </TMPopup>
</template>

<script>
import TMPopup from "@/components/TMPopup.vue";
import TMTextEditor from "@/components/TMTextEditor.vue";
import TMComboBox from "@/components/TMComboBox.vue";
import TMMarkdownViewer from "@/common/markdown/TMMarkdownViewer.vue";

export default {
  name: "TMQuickPreview",
  components: { TMPopup, TMTextEditor, TMComboBox, TMMarkdownViewer },
  props: {
    ownerForm: { type: Object, default: null },
    onClose: { type: Function, default: null },
  },
  data() {
    return {
      previewLabel: "",
      previewValue: "",
      previewLanguage: "plaintext",
      renderMarkdown: false,
      langOptions: [
        "json",
        "sql",
        "pgsql",
        "mysql",
        "xml",
        "html",
        "css",
        "scss",
        "yaml",
        "markdown",
        "javascript",
        "typescript",
        "plaintext",
        "php",
        "python",
        "ruby",
        "go",
        "java",
        "csharp",
        "shell",
        "powershell",
        "dockerfile",
        "ini",
        "bat",
        "rust",
        "kotlin",
        "swift",
      ].map((l) => ({ value: l, label: l })),
    };
  },
  methods: {
    show({ value, label, language, renderMarkdown }) {
      this.renderMarkdown = renderMarkdown === true;
      this.previewLabel = label || "";
      let str;
      if (value !== null && value !== undefined && typeof value === "object") {
        str = JSON.stringify(value, null, 2);
      } else {
        str = value != null ? String(value) : "";
      }
      this.previewValue = str;
      this.previewLanguage = language || this.detectLang(str);
    },
    handleCopyContent() {
      let me = this;
      if (me.previewValue) {
        // Copy nguyên chuỗi markdown gốc, không phải HTML đã render.
        me.$tmUtility.copyToClipboard(me.previewValue);
      }
    },
    handleClose() {
      this.onClose?.();
    },
    detectLang(str) {
      if (!str) return "plaintext";
      try {
        JSON.parse(str);
        return "json";
      } catch {
        return "plaintext";
      }
    },
  },
};
</script>

<style scoped>
.tm-preview-editor {
  width: 100%;
  height: 100%;
}

/* Nút copy nằm trong slot header nên không ăn scoped style của TMPopup —
   nhân lại kiểu của .tm-popup-close để đồng bộ với nút fullscreen/close. */
.tm-popup-close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  background: none;
  font-size: 24px;
  cursor: pointer;
  filter: grayscale(100);
}
.tm-popup-close:hover {
  border: 1px solid var(--border-color);
  filter: grayscale(0);
}
</style>
