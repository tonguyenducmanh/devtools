<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    isFullPopup
    :title="previewLabel"
    @close="handleClose"
  >
    <template #header>
      <TDComboBox
        v-model="previewLanguage"
        :options="langOptions"
        :noMargin="true"
        :isCapitalizeText="false"
        :width="130"
      />
    </template>
    <div class="td-preview-editor">
      <TDTextarea
        :modelValue="previewValue"
        :readOnly="true"
        :wrapText="true"
        :enableHighlight="true"
        :language="previewLanguage"
      />
    </div>
  </TDPopup>
</template>

<script>
import TDPopup from "@/components/TDPopup.vue";
import TDTextarea from "@/components/TDTextarea.vue";
import TDComboBox from "@/components/TDComboBox.vue";

export default {
  name: "TDQuickPreview",
  components: { TDPopup, TDTextarea, TDComboBox },
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
    show({ value, label }) {
      this.previewLabel = label || "";
      let str;
      if (value !== null && value !== undefined && typeof value === "object") {
        str = JSON.stringify(value, null, 2);
      } else {
        str = value != null ? String(value) : "";
      }
      this.previewValue = str;
      this.previewLanguage = this.detectLang(str);
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
.td-preview-editor {
  width: 100%;
  height: 100%;
}
</style>
