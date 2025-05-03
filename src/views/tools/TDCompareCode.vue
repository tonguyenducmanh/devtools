<template>
  <div>
    <div class="flex flex-col container">
      <div class="title">💖 Compare two file (diff changes) !</div>
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
        class="td-checkbox-sibe-by-side"
      ></TDCheckbox>
      <div class="flex">
        <TDButton @click="applyMock" label="Example"></TDButton>
        <TDButton @click="compare" label="Compare diff changes"></TDButton>
      </div>
    </div>
    <div class="diff-output" v-html="diffOutputHtml"></div>
  </div>
</template>
<script>
import * as Diff2Html from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import { createTwoFilesPatch } from "diff";
import { compareCodeMock } from "@/mock/mock.js";
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
    applyMock() {
      let me = this;
      me.$tdUtility.applyMock(me, compareCodeMock);
    },
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
.diff-output {
  display: block;
  width: 100%;
}
</style>
