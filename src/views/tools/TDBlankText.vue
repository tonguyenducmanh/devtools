<template>
  <div class="flex flex-col container">
    <div class="flex editor-container">
      <TDTextEditor
        :placeHolder="$t('i18nCommon.blanktext.placeholder')"
        v-model="content"
        height="100%"
        width="100%"
        :enableHighlight="currentConfigLayout.enableHighlight"
        :language="currentConfigLayout.language"
        :wrapText="currentConfigLayout.wrapText"
        :monacoOptions="monacoOptions"
      ></TDTextEditor>
    </div>
    <div class="flex tool-footer">
      <TDComboBox
        :width="200"
        v-model="currentConfigLayout.language"
        @selected="updateConfigLayout"
        :options="methodOptions"
        :isDropTop="true"
        :noMargin="true"
        :placeHolder="$t('i18nCommon.blanktext.selectLanguage')"
      />
      <TDButton
        :noMargin="true"
        @click="handleCopy"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.copy')"
      ></TDButton>
      <TDButton
        :noMargin="true"
        @click="handleDownload"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.blanktext.download')"
      ></TDButton>
      <div>
        <TDCheckbox
          v-model="currentConfigLayout.wrapText"
          @change="updateConfigLayout"
          :label="$t('i18nCommon.wrapText')"
        ></TDCheckbox>
      </div>
    </div>
  </div>
</template>
<script>
import { registerPgsqlFormatProvider } from "@/components/monarch/pgsqlFormatProvider.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
export default {
  extends: TDToolBase,
  name: "TDBlankText",
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.BlankTextConfigLayout,
      content: "",
      currentConfigLayout: {
        enableHighlight: true,
        wrapText: true,
        language: "json",
      },
      methodOptions: [
        { value: "plaintext", label: "Plain Text" },
        { value: "javascript", label: "JavaScript" },
        { value: "typescript", label: "TypeScript" },
        { value: "json", label: "JSON" },
        { value: "xml", label: "XML" },
        { value: "html", label: "HTML" },
        { value: "css", label: "CSS" },
        { value: "scss", label: "SCSS" },
        { value: "sql", label: "SQL" },
        { value: "pgsql", label: "Postgres SQL" },
        { value: "mysql", label: "MySQL" },
        { value: "csharp", label: "C#" },
        { value: "go", label: "Go" },
        { value: "shell", label: "Shell" },
        { value: "powershell", label: "PowerShell" },
        { value: "dockerfile", label: "Dockerfile" },
        { value: "yaml", label: "YAML" },
        { value: "markdown", label: "Markdown" },
        { value: "ini", label: "INI" },
        { value: "bat", label: "Batch" },
      ],
    };
  },
  watch: {
    content(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.content);
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
        me.$tdUtility.copyToClipboard(me.content);
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.copy"));
      }
    },
    handleDownload() {
      let me = this;
      if (me.content) {
        const extension = me.getFileExtension(me.currentConfigLayout.language);
        const blob = new Blob([me.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `text-editor.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        me.$tdToast.success(me.$t("i18nCommon.blanktext.downloaded"));
      }
    },
    getFileExtension(language) {
      const extensionMap = {
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
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tool-footer {
  width: 100%;
  align-items: center;
  gap: var(--padding);
  margin-top: var(--padding);
}
.editor-container {
  flex: 1;
  width: 100%;
}
</style>
