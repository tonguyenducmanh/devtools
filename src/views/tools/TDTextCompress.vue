<template>
  <div class="flex flex-col container">
    <div class="title">{{ $t("i18nCommon.textCompress.title") }}</div>
    <div class="paste-box">
      <div class="flex compress-input">
        <TDTextarea
          :placeHolder="$t('i18nCommon.textCompress.input.compress')"
          v-model="inputSource"
        ></TDTextarea>
        <TDTextarea
          :placeHolder="$t('i18nCommon.textCompress.input.decompress')"
          v-model="outputSource"
        ></TDTextarea>
      </div>
    </div>
    <div>
      <TDRadioGroup
        v-model="compressAlgorithms"
        :label="$t('i18nCommon.textCompress.input.algorithm')"
        :options="radioImports"
      />
    </div>
    <div class="flex group-btn">
      <TDButton
        @click="handleCompress"
        :label="$t('i18nCommon.textCompress.buttons.compress')"
      ></TDButton>
      <TDButton
        @click="handleDempress"
        :label="$t('i18nCommon.textCompress.buttons.decompress')"
      ></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.textCompress.buttons.example')"
      ></TDButton>
      <TDButton
        @click="handleCopyEvent(inputSource)"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.textCompress.buttons.copyInput')"
      ></TDButton>
      <TDButton
        @click="handleCopyEvent(outputSource)"
        :type="$tdEnum.buttonType.secondary"
        :label="$t('i18nCommon.textCompress.buttons.copyOutput')"
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
      let percentRatio = Math.round(ratio * 100).toFixed(2);
      return this.$t("i18nCommon.textCompress.stats.ratio", [percentRatio]);
    },
    inputLengthText() {
      let sourceLength = this.inputSource ? this.inputSource.length : 0;
      return this.$t("i18nCommon.textCompress.stats.inputLength", [
        sourceLength,
      ]);
    },
    outputLengthText() {
      let sourceLength = this.outputSource ? this.outputSource.length : 0;
      return this.$t("i18nCommon.textCompress.stats.outputLength", [
        sourceLength,
      ]);
    },
  },
  mounted() {},
  methods: {
    handleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
    },
    async applyMock() {
      // Lazy-load module
      const { TDMockTextCompress } = await import(
        /* webpackChunkName: "mock-text-compress" */
        "@/common/mock/TDMockTextCompress.js"
      );
      this.$tdUtility.applyMock(this, TDMockTextCompress);
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
      me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
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
      me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
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
          value: this.$tdEnum.compressType.deflate,
          label: "Deflate",
        },
        {
          value: this.$tdEnum.compressType.deflateRaw,
          label: "Deflate raw",
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
  border-radius: 0;

  box-shadow: none;
}
.paste-box {
  flex: 1;
  width: 100%;
}
.compress-input {
  width: 100%;
  column-gap: var(--padding);
  height: 100%;
}
.group-btn {
  justify-content: flex-start;
}
</style>
