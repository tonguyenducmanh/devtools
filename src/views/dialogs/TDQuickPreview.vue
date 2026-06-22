<template>
  <TDPopup
    :visible="true"
    :showHeader="true"
    width="80vw"
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
      previewLanguage: "json",
      langOptions: [
        "json", "sql", "pgsql", "mysql", "xml", "html", "css", "scss",
        "yaml", "markdown", "javascript", "typescript", "plaintext",
        "php", "python", "ruby", "go", "java", "csharp", "shell",
        "powershell", "dockerfile", "ini", "bat", "rust", "kotlin", "swift",
      ].map(l => ({ value: l, label: l })),
    };
  },
  methods: {
    show({ value, label }) {
      this.previewLabel = label || "";
      let v = value;
      if (v !== null && v !== undefined && typeof v === "object") {
        v = JSON.stringify(v, null, 2);
      }
      this.previewValue = v != null ? String(v) : "";
      this.previewLanguage = this.detectLang(label);
    },
    handleClose() {
      this.onClose?.();
    },
    detectLang(label) {
      const text = (label || "").toLowerCase();
      if (/json|jsonb/.test(text)) return "json";
      if (/xml/.test(text)) return "xml";
      if (/html/.test(text)) return "html";
      if (/css/.test(text)) return /scss/.test(text) ? "scss" : "css";
      if (/yaml|yml/.test(text)) return "yaml";
      if (/sql|query/.test(text)) return /mysql/.test(text) ? "mysql" : /pgsql|postgres/.test(text) ? "pgsql" : "sql";
      if (/md|markdown/.test(text)) return "markdown";
      if (/js|javascript|script/.test(text)) return "javascript";
      if (/ts|typescript/.test(text)) return "typescript";
      if (/php/.test(text)) return "php";
      if (/py|python/.test(text)) return "python";
      if (/rb|ruby/.test(text)) return "ruby";
      if (/go|golang/.test(text)) return "go";
      if (/java/.test(text)) return "java";
      if (/cs|csharp|c#/.test(text)) return "csharp";
      if (/sh|bash|shell|zsh/.test(text)) return "shell";
      if (/ps1|powershell/.test(text)) return "powershell";
      if (/docker|dockerfile/.test(text)) return "dockerfile";
      if (/ini/.test(text)) return "ini";
      if (/bat|batch/.test(text)) return "bat";
      if (/rs|rust/.test(text)) return "rust";
      if (/kt|kotlin/.test(text)) return "kotlin";
      if (/swift/.test(text)) return "swift";
      return "json";
    },
  },
};
</script>

<style scoped>
.td-preview-editor {
  height: 70vh;
}
</style>
