<template>
  <div class="container">
    <div class="title">PostgreSQL Formatter!</div>
    <div class="flex compress-input">
      <TDTextarea
        placeHolder="Text to compress"
        v-model="inputSource"
        height="400px"
        width="50%"
      ></TDTextarea>
      <TDTextarea
        placeHolder="Text from compress"
        v-model="outputSource"
        height="400px"
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
</style>
