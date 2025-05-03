<template>
  <div class="container flex flex-col">
    <div class="title">💖 Base64 to Image tool!</div>
    <div class="flex td-compare-box">
      <TDTextarea
        placeHolder="Fist code file to compare"
        v-model="firstCodeFile"
        :label="oldTitle"
        isLabelTop
        height="400px"
        width="500px"
      ></TDTextarea>
      <TDTextarea
        placeHolder="Second code file to compare"
        v-model="secondCodeFile"
        :label="newTitle"
        isLabelTop
        height="400px"
        width="500px"
      ></TDTextarea>
    </div>
    <TDCheckbox
      v-model="isCompareSideBySide"
      label="compare style (true is side by side, false is line by line)"
      @input="compare"
    ></TDCheckbox>
    <TDButton @click="compare" label="Compare diff changes"></TDButton>
    <div class="diff-output" v-html="diffOutputHtml"></div>
  </div>
</template>
<script>
import * as Diff2Html from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import { createTwoFilesPatch } from "diff";
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
    compare() {
      let me = this;
      if (me.firstCodeFile && me.secondCodeFile) {
        let diff = createTwoFilesPatch(
          me.oldTitle,
          me.newTitle,
          me.firstCodeFile,
          me.secondCodeFile
        );
        me.diffOutputHtml = Diff2Html.html(diff, {
          inputFormat: "diff",
          showFiles: true,
          matching: "lines",
          outputFormat: me.isCompareSideBySide
            ? "side-by-side"
            : "line-by-line",
        });
      }
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
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;
  min-height: 100vh;
  box-shadow: none;
}
.td-compare-box {
  column-gap: var(--padding);
}
.diff-output {
  display: block;
  width: 100%;
}
</style>
