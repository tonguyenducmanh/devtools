<template>
  <div class="flex flex-col container">
    <div class="flex">
      <TDComboBox
        :width="200"
        v-model="language"
        :options="methodOptions"
        @selected="compare"
      />
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.compareCode.example')"
      ></TDButton>
    </div>
    <div class="highlight-layer" ref="textareaWrap"></div>
  </div>
</template>

<script>
import * as monaco from "monaco-editor";

export default {
  name: "TDCompareCode",
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
      const { TDMockCompareCode } = await import(
        /* webpackChunkName: "mock-compare-code" */
        "@/common/mock/TDMockCompareCode.js"
      );
      this.$tdUtility.applyMock(this, TDMockCompareCode);
      await me.compare();
    },
    async compare() {
      let me = this;
      me.unmountEditor();
      if (me.firstCodeFile && me.secondCodeFile) {
        let me = this;
        me.currentTheme = await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme);
        monaco.languages.register({ id: me.language });
        let configObject = {
          theme: me.currentTheme == me.$tdEnum.theme.dark ? "vs-dark" : "vs",
          fontSize: 16,
          originalEditable: true,
          automaticLayout: true,
        };
        if (me.wrapText) {
          configObject.wordWrap = "on";
          configObject.wordWrapColumn = 0;
          configObject.wrappingIndent = "none";
        }
        me.originalModel = monaco.editor.createModel(
          me.firstCodeFile,
          me.language
        );
        me.modifiedModel = monaco.editor.createModel(
          me.secondCodeFile,
          me.language
        );

        me.editor = monaco.editor.createDiffEditor(
          me.$refs.textareaWrap,
          configObject
        );
        me.editor.setModel({
          original: me.originalModel,
          modified: me.modifiedModel,
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
.container {
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}
.td-compare-box {
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
