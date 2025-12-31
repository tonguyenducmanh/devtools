<template>
  <div>
    <div class="container">
      <!-- <div class="title">{{ $t("i18nCommon.compareCode.title") }}</div> -->
      <div class="flex flex-wrap td-compare-box">
        <TDTextarea
          :placeHolder="$t('i18nCommon.compareCode.firstFile')"
          v-model="firstCodeFile"
          :label="oldTitle"
          isLabelTop
          height="400px"
          width="500px"
        ></TDTextarea>
        <TDTextarea
          :placeHolder="$t('i18nCommon.compareCode.secondFile')"
          v-model="secondCodeFile"
          :label="newTitle"
          isLabelTop
          height="400px"
          width="500px"
        ></TDTextarea>
      </div>
      <div class="flex">
        <TDButton
          @click="compare"
          :label="$t('i18nCommon.compareCode.compare')"
        ></TDButton>
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.compareCode.example')"
        ></TDButton>
      </div>
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
  mounted() {},
  methods: {
    async applyMock() {
      // Lazy-load module
      const { TDMockCompareCode } = await import(
        /* webpackChunkName: "mock-compare-code" */
        "@/common/mock/TDMockCompareCode.js"
      );
      this.$tdUtility.applyMock(this, TDMockCompareCode);
    },
    async compare() {
      let me = this;
      if (me.firstCodeFile && me.secondCodeFile) {
        let me = this;
        me.currentTheme = await me.$tdCache.get(me.$tdEnum.cacheConfig.Theme);
        monaco.languages.register({ id: me.language });
        let configObject = {
          model: me.editorModel,
          language: me.language,
          theme: me.currentTheme == me.$tdEnum.theme.dark ? "vs-dark" : "vs",
          fontSize: 16,
          readOnly: me.readOnly,
          automaticLayout: true,
        };
        if (me.wrapText) {
          configObject.wordWrap = "on";
          configObject.wordWrapColumn = 0;
          configObject.wrappingIndent = "none";
        }
        me.originalModel = monaco.editor.createModel(
          me.firstCodeFile,
          "text/plain"
        );
        me.modifiedModel = monaco.editor.createModel(
          me.secondCodeFile,
          "text/plain"
        );

        me.editor = monaco.editor.createDiffEditor(me.$refs.textareaWrap, {
          originalEditable: true,
          automaticLayout: true,
        });
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
  padding: 2rem;
  border-radius: 0;
  box-shadow: none;
}
.td-checkbox-sibe-by-side {
  display: flex;
  align-items: center;
  justify-content: center;
}
.td-compare-box {
  column-gap: var(--padding);
}
.highlight-layer {
  width: 100%;
  height: 100%;
  margin: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}
</style>
