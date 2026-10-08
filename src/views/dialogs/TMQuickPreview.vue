<template>
  <TMPopup
    :visible="true"
    :showHeader="true"
    isFullPopup
    :title="previewLabel"
    @close="handleClose"
  >
    <div class="tm-preview-editor">
      <TMTextEditor
        :modelValue="previewValue"
        :readOnly="true"
        :wrapText="true"
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

export default {
  name: "TMQuickPreview",
  components: { TMPopup, TMTextEditor, TMComboBox },
  props: {
    ownerForm: { type: Object, default: null },
    onClose: { type: Function, default: null },
  },
  data() {
    return {
      previewLabel: "",
      previewValue: "",
      previewLanguage: "plaintext",
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
    show({ value, label, language }) {
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
</style>
