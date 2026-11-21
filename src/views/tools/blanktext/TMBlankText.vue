<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex tool-header">
        <TMComboBox
          :width="200"
          v-model="currentConfigLayout.language"
          @selected="updateConfigLayout"
          :options="methodOptions"
          :noMargin="true"
          :isSmallButton="true"
          :placeHolder="$t('i18nCommon.blanktext.selectLanguage')"
        />
        <TMUpload
          :label="$t('i18nCommon.blanktext.uploadLabel')"
          :isShowSelect="false"
          :isSmallButton="true"
          @selected="handleFileUpload"
        />
        <TMButton
          :noMargin="true"
          :isSmallButton="true"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-copy-icon"
          v-tooltip="$t('i18nCommon.copy')"
          @click="handleCopy"
        ></TMButton>
        <TMButton
          :noMargin="true"
          :isSmallButton="true"
          :type="$tmEnum.buttonType.secondary"
          iconClass="tm-download-icon"
          v-tooltip="$t('i18nCommon.blanktext.download')"
          @click="handleDownload"
        ></TMButton>
      </div>
      <div class="flex editor-container">
        <TMTextEditor
          :placeHolder="$t('i18nCommon.blanktext.placeholder')"
          v-model="content"
          height="100%"
          width="100%"
          :enableHighlight="currentConfigLayout.enableHighlight"
          :language="currentConfigLayout.language"
          :monacoOptions="monacoOptions"
          @change="handleEditorChange"
        ></TMTextEditor>
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
        <div class="flex flex-col tm-sub-sidebar">
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
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMBlankTextShared from "@/views/tools/blanktext/TMBlankTextShared.js";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMSlideOption from "@/components/TMSlideOption.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";

export default {
  extends: TMToolBase,
  mixins: [TMBlankTextShared],
  name: "TMBlankText",
  components: { TMSubSidebar, TMSlideOption, TMHistorySidebar },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.BlankTextConfigLayout,
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
        { value: "ini", label: "INI" },
        { value: "bat", label: "Batch" },
      ],
    };
  },
  computed: {
    sidebarOptions() {
      return [
        {
          value: this.$tmEnum.ToolSidebarOption.History,
          label: this.$t("i18nCommon.history.title"),
          icon: "tm-history-icon",
        },
      ];
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
.tool-header {
  width: 100%;
  align-items: center;
  gap: var(--padding);
  margin-bottom: var(--padding);
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
