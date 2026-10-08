<template>
  <div class="flex tm-compare-code">
    <div class="flex flex-col container">
      <div class="highlight-layer" ref="textareaWrap"></div>
      <div class="flex">
        <TMComboBox
          :width="200"
          v-model="language"
          :options="methodOptions"
          @selected="compare"
          :isDropTop="true"
        />
        <TMCheckbox
          v-model="currentConfigLayout.wrapText"
          :label="$t('i18nCommon.apiTesting.wrapText')"
          @change="updateLayout"
        ></TMCheckbox>
        <TMButton
          @click="applyMock"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.compareCode.example')"
        ></TMButton>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <TMCompareCodeHelp />
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import * as monaco from "monaco-editor";
import { registerAllMonacoThemes } from "@/monarch/TMMonacoTheme.js";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMCompareCodeHelp from "@/views/helps/TMCompareCodeHelp.vue";
export default {
  extends: TMToolBase,
  name: "TMCompareCode",
  components: { TMSubSidebar, TMCompareCodeHelp },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {
    this.applyMock();
  },
  methods: {
    async applyMock() {
      let me = this;
      // Lazy-load module
      const { TMMockCompareCode } = await import(
        /* webpackChunkName: "mock-compare-code" */
        "@/common/mock/TMMockCompareCode.js"
      );
      this.$tmUtility.applyMock(this, TMMockCompareCode);
      await me.compare();
    },
    async compare() {
      let me = this;
      me.unmountEditor();
      if (me.firstCodeFile && me.secondCodeFile) {
        let me = this;
        me.currentTheme = await me.$tmUtility.getUserSettings("theme");
        monaco.languages.register({ id: me.language });
        registerAllMonacoThemes(monaco);
        let configObject = {
          theme: me.currentTheme,
          fontSize: 16,
          originalEditable: true,
          automaticLayout: true,
        };
        if (me.currentConfigLayout.wrapText) {
          configObject.wordWrap = "on";
          configObject.wordWrapColumn = 0;
          configObject.wrappingIndent = "none";
        }
        me.originalModel = monaco.editor.createModel(
          me.firstCodeFile,
          me.language,
        );
        me.modifiedModel = monaco.editor.createModel(
          me.secondCodeFile,
          me.language,
        );

        me.editor = monaco.editor.createDiffEditor(
          me.$refs.textareaWrap,
          configObject,
        );
        me.editor.setModel({
          original: me.originalModel,
          modified: me.modifiedModel,
        });
      }
    },
    updateLayout() {
      let me = this;
      me.updateConfigLayout();
      if (me.editor) {
        me.editor.updateOptions({
          wordWrap: me.currentConfigLayout.wrapText ? "on" : "off",
        });
      }
    },
    unmountEditor() {
      let me = this;
      if (me.editor) {
        me.editor.dispose();
      }
      if (me.originalModel) {
        me.originalModel.dispose();
      }
      if (me.modifiedModel) {
        me.modifiedModel.dispose();
      }
      me.editor = null;
      me.originalModel = null;
      me.modifiedModel = null;
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.CompareCodeConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        wrapText: true,
      },
      firstCodeFile: null,
      secondCodeFile: null,
      diffOutputHtml: null,
      isCompareSideBySide: true,
      oldTitle: "old.txt",
      newTitle: "new.txt",
      language: "text/plan",
      methodOptions: [
        { value: "text/plan", label: "text/plan" },
        { value: "sql", label: "sql" },
        { value: "pgsql", label: "Postgres SQL" },
        { value: "mysql", label: "MySql" },
        { value: "json", label: "json" },
        { value: "css", label: "css" },
        { value: "javascript", label: "javascript" },
        { value: "typescript", label: "typescript" },
        { value: "csharp", label: "C#" },
        { value: "cpp", label: "C++" },
        { value: "rust", label: "Rust" },
        { value: "shell", label: "shell" },
        { value: "xml", label: "XML" },
        { value: "yaml", label: "YAML" },
        { value: "powershell", label: "Powershell" },
        { value: "markdown", label: "Markdown" },
      ],
    };
  },
  beforeUnmount() {
    this.unmountEditor();
  },
};
</script>
<style scoped>
.tm-compare-code {
  width: 100%;
  height: 100%;
}
.container {
  width: 100%;
  height: 100%;
  flex: 1;
  border-radius: 0;
  box-shadow: none;
}
.tm-compare-box {
  column-gap: var(--padding);
}
.highlight-layer {
  flex: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}
</style>
