<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex editor-container">
        <TMTextEditor
          :placeHolder="$t('i18nCommon.blanktext.placeholder')"
          v-model="content"
          height="100%"
          width="100%"
          :enableHighlight="currentConfigLayout.enableHighlight"
          :language="currentConfigLayout.language"
          :wrapText="currentConfigLayout.wrapText"
          :monacoOptions="monacoOptions"
          @change="handleEditorChange"
        ></TMTextEditor>
      </div>
      <div class="flex tool-footer">
        <TMComboBox
          :width="200"
          v-model="currentConfigLayout.language"
          @selected="updateConfigLayout"
          :options="methodOptions"
          :isDropTop="true"
          :noMargin="true"
          :placeHolder="$t('i18nCommon.blanktext.selectLanguage')"
        />
        <TMButton
          :noMargin="true"
          @click="handleCopy"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.copy')"
        ></TMButton>
        <TMButton
          :noMargin="true"
          @click="handleDownload"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.blanktext.download')"
        ></TMButton>
        <div>
          <TMCheckbox
            v-model="currentConfigLayout.wrapText"
            @change="updateConfigLayout"
            :label="$t('i18nCommon.wrapText')"
            :variant="$tmEnum.checkboxType.switch"
          ></TMCheckbox>
        </div>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            titleKey="content"
            :noMargin="true"
            :maxHistoryLength="1000"
            :cacheKey="$tmEnum.cacheConfig.BlankTextHistory"
          />
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
import { registerPgsqlFormatProvider } from "@/monarch/pgsql/pgsqlFormatProvider.js";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMSlideOption from "@/components/TMSlideOption.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import _ from "@/common/TMCommonFunction.js";
export default {
  extends: TMToolBase,
  name: "TMBlankText",
  components: { TMSubSidebar, TMSlideOption, TMHistorySidebar },
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
      keyCacheLayout: this.$tmEnum.cacheConfig.BlankTextConfigLayout,
      content: "",
      currentConfigLayout: {
        enableHighlight: true,
        wrapText: true,
        language: "json",
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.History,
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
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.ToolSidebarOption.History,
        label: this.$t("i18nCommon.history.title"),
        icon: "tm-history-icon",
      });
      return options;
    },
  },
  methods: {
    handleCopy() {
      let me = this;
      if (me.content) {
        me.$tmUtility.copyToClipboard(me.content);
        me.$tmToast.success(me.$t("i18nCommon.toastMessage.copy"));
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
        me.saveToHistory();
        me.$tmToast.success(me.$t("i18nCommon.blanktext.downloaded"));
      }
    },
    /**
     * Lắng nghe sự kiện change từ TMTextEditor khi user đang gõ
     * Chỉ reset debounce lưu history, không ghi ngược lại editor
     * @param {string} value - Giá trị editor hiện tại
     */
    handleEditorChange(value) {
      let me = this;
      me._latestEditorValue = value;
      if (!me._isApplyingHistory) {
        me.debouncedSaveToHistory();
      }
    },
    /**
     * Lưu nội dung hiện tại vào lịch sử
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
     * Áp dụng nội dung từ lịch sử
     * @param {Object} item - Item lịch sử
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
}
.main-tool {
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
.tm-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}
</style>
