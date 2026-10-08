<template>
  <div class="flex tm-text-compress">
    <div class="flex flex-col container">
      <!-- <div class="title">{{ $t("i18nCommon.textCompress.title") }}</div> -->
      <div class="paste-box">
        <div class="flex compress-input">
          <TMTextEditor
            :placeHolder="$t('i18nCommon.textCompress.input.compress')"
            v-model="inputSource"
          ></TMTextEditor>
          <TMTextEditor
            :placeHolder="$t('i18nCommon.textCompress.input.decompress')"
            v-model="outputSource"
          ></TMTextEditor>
        </div>
      </div>
      <div>
        <TMRadioGroup
          v-model="compressAlgorithms"
          :label="$t('i18nCommon.textCompress.input.algorithm')"
          :options="radioImports"
        />
      </div>
      <div class="flex group-btn">
        <TMButton
          @click="handleCompress"
          :label="$t('i18nCommon.textCompress.buttons.compress')"
        ></TMButton>
        <TMButton
          @click="handleDempress"
          :label="$t('i18nCommon.textCompress.buttons.decompress')"
        ></TMButton>
        <TMButton
          @click="applyMock"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.textCompress.buttons.example')"
        ></TMButton>
        <TMButton
          @click="handleCopyEvent(inputSource)"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.textCompress.buttons.copyInput')"
        ></TMButton>
        <TMButton
          @click="handleCopyEvent(outputSource)"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.textCompress.buttons.copyOutput')"
        ></TMButton>
      </div>
      <div class="flex compress-info" v-if="compressRatio">
        <div>{{ inputLengthText }}</div>
        <div>{{ outputLengthText }}</div>
        <div>{{ compressRatio }}</div>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <TMTextCompressHelp />
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
import TMCompress from "@/common/compress/TMCompress.js";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMTextCompressHelp from "@/views/helps/TMTextCompressHelp.vue";
export default {
  extends: TMToolBase,
  name: "TMTextCompress",
  components: { TMSubSidebar, TMTextCompressHelp },
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
      return this.$t("i18nCommon.textCompress.stats.ratio").format(
        percentRatio,
      );
    },
    inputLengthText() {
      let sourceLength = this.inputSource ? this.inputSource.length : 0;
      return this.$t("i18nCommon.textCompress.stats.inputLength").format(
        sourceLength,
      );
    },
    outputLengthText() {
      let sourceLength = this.outputSource ? this.outputSource.length : 0;
      return this.$t("i18nCommon.textCompress.stats.outputLength").format(
        sourceLength,
      );
    },
  },
  mounted() {},
  methods: {
    handleCopyEvent(value) {
      let me = this;
      me.$tmUtility.copyToClipboard(value);
    },
    async applyMock() {
      // Lazy-load module
      const { TMMockTextCompress } = await import(
        /* webpackChunkName: "mock-text-compress" */
        "@/common/mock/TMMockTextCompress.js"
      );
      this.$tmUtility.applyMock(this, TMMockTextCompress);
    },
    async handleCompress() {
      let me = this;
      let result = null;
      if (me.inputSource) {
        result = await TMCompress.compressText(
          me.inputSource,
          me.compressAlgorithms,
        );
      }
      me.outputSource = result;
      me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
    },
    async handleDempress() {
      let me = this;
      let result = null;
      if (me.outputSource) {
        result = await TMCompress.decompressText(
          me.outputSource,
          me.compressAlgorithms,
        );
      }
      me.inputSource = result;
      me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.TextCompressConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
      },
      inputSource: null,
      outputSource: null,
      compressAlgorithms: this.$tmEnum.compressType.gzip,
      radioImports: [
        { value: this.$tmEnum.compressType.gzip, label: "Gzip" },
        {
          value: this.$tmEnum.compressType.deflate,
          label: "Deflate",
        },
        {
          value: this.$tmEnum.compressType.deflateRaw,
          label: "Deflate raw",
        },
      ],
    };
  },
};
</script>
<style scoped>
.tm-text-compress {
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

.compress-info {
  column-gap: var(--padding);
}
</style>
