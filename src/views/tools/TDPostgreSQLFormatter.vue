<template>
  <div class="container">
    <div class="title">PostgreSQL formatter (beta)!</div>
    <div class="flex input-container">
      <TDTextarea
        placeHolder="PostgreSQL raw input"
        v-model="inputSource"
        height="100%"
        width="50%"
      ></TDTextarea>
      <TDTextarea
        placeHolder="PostgreSQL formatted output"
        v-model="outputSource"
        height="100%"
        width="50%"
      ></TDTextarea>
    </div>
    <div class="flex">
      <TDButton @click="handleFormat" label="format"></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        label="Example"
      ></TDButton>
      <TDButton
        @click="handleCopyEvent(outputSource)"
        :type="$tdEnum.buttonType.secondary"
        label="Copy output"
      ></TDButton>
    </div>
  </div>
</template>
<script>
import { TDPostgreSQLFormatter } from "@/common/mock/mock.js";
import { formatCode } from "@/common/formatter/postgresql/postgreSQLFormatter.js";

export default {
  name: "TDPostgreSQLFormatter",
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
      me.$tdUtility.applyMock(me, TDPostgreSQLFormatter);
    },
    handleFormat() {
      let me = this;
      if (me.inputSource) {
        me.outputSource = formatCode(me.inputSource);
      } else {
        me.outputSource = null;
      }
    },
    handleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
    },
  },
  data() {
    return {
      inputSource: null,
      outputSource: null,
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
.input-container {
  column-gap: var(--padding);
  height: 80%;
}
</style>
