<template>
  <div class="container">
    <div class="title">Text Compress Algorithms!</div>
    <div class="flex flex-wrap paste-box">
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
    </div>
    <div>
      <TDRadioGroup
        v-model="compressAlgorithms"
        label="Thuật toán nén dữ liệu"
        :options="radioImports"
      />
    </div>
    <div class="flex">
      <TDButton @click="handleCompress" label="Compress"></TDButton>
      <TDButton @click="handleDempress" label="Decompress"></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        label="Example"
      ></TDButton>
    </div>
    <div v-if="compressRatio">
      <div>{{ inputLengthText }}</div>
      <div>{{ outputLengthText }}</div>
      <div>{{ compressRatio }}</div>
    </div>
  </div>
</template>
<script>
import { TDTextCompress } from "@/common/mock/mock.js";
import TDCompress from "@/common/compress/TDCompress.js";

export default {
  name: "TDTextCompress",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  computed: {
    compressRatio() {
      let ratio = 1;
      if (this.inputSource && this.outputSource) {
        ratio = this.inputSource.length / this.outputSource.length;
      }
      let percentRatio = (Math.round(ratio * 100) / 100).toFixed(2);
      return `Tỷ lệ nén ${percentRatio} %`;
    },
    inputLengthText() {
      let sourceLength = this.inputSource ? this.inputSource.length : 0;
      return `Độ dài text input ${sourceLength}`;
    },
    outputLengthText() {
      let sourceLength = this.outputSource ? this.outputSource.length : 0;
      return `Độ dài text output ${sourceLength}`;
    },
  },
  mounted() {},
  methods: {
    applyMock() {
      let me = this;
      me.$tdUtility.applyMock(me, TDTextCompress);
    },
    async handleCompress() {
      let me = this;
      let result = null;
      if (me.inputSource) {
        result = await TDCompress.compressText(
          me.inputSource,
          me.compressAlgorithms
        );
      }
      me.outputSource = result;
    },
    async handleDempress() {
      let me = this;
      let result = null;
      if (me.outputSource) {
        result = await TDCompress.decompressText(
          me.outputSource,
          me.compressAlgorithms
        );
      }
      me.inputSource = result;
    },
  },
  data() {
    return {
      inputSource: null,
      outputSource: null,
      compressAlgorithms: this.$tdEnum.compressType.gzip,
      radioImports: [
        { value: this.$tdEnum.compressType.gzip, label: "Gzip" },
        {
          value: this.$tdEnum.compressType.brotli,
          label: "Brotli",
          disabled: true,
        },
      ],
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
.compress-input {
  width: 100%;
}
</style>
