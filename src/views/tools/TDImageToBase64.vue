<template>
  <div class="flex flex-col container">
    <div class="flex upload-data">
      <div class="flex flex-col upload-area">
        <div>
          <TDUpload
            @selected="processFile"
            ref="uploadArea"
            class="upload-area"
          ></TDUpload>
        </div>
        <div>
          <img v-if="srcImg" :src="srcImg" class="preview" />
        </div>
      </div>
      <div class="result-container">
        <TDTextarea
          ref="base64-output"
          :placeHolder="$t('i18nCommon.imageToBase64.placeHolder')"
          v-model="base64Result"
          :readOnly="true"
        ></TDTextarea>
      </div>
    </div>
    <div class="flex">
      <TDButton
        ref="copy-btn"
        @click="haddleCopyEvent"
        :label="$t('i18nCommon.imageToBase64.copyButton')"
      ></TDButton>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDImageToBase64",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    haddleCopyEvent() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.base64Result);
    },
    processFile(files) {
      let me = this;
      let data = null;
      if (Array.isArray(files)) {
        data = files[0];
      } else {
        data = files;
      }
      me.handleImageToBase64(data);
    },
    handleImageToBase64(blob) {
      let me = this;
      me.srcImg = URL.createObjectURL(blob);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        me.base64Result = reader.result;
      };
      reader.readAsDataURL(blob);
      me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
    },
  },
  data() {
    return {
      base64Result: null,
      srcImg: null,
    };
  },
};
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
  .upload-data {
    gap: var(--padding);
    flex: 1;
    .upload-area {
      .preview{
      }
    }
    .result-container {
    }
  }
}
</style>
