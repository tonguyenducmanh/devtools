<template>
  <div class="flex flex-col container">
    <div class="title">{{ $t("i18nCommon.qrCodeToText.title") }}</div>
    <div class="flex flex-col qr-section">
      <div>
        {{ $t("i18nCommon.qrCodeToText.note") }}
      </div>
      <br />
      <TDUpload
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        ref="uploadArea"
        class="upload-area"
        maxHeight="60px"
        :labelEmpty="$t('i18nCommon.qrCodeToText.dropZone.placeholder')"
        :label="$t('i18nCommon.qrCodeToText.dropZone.label')"
        multiple
        @selected="convertQRCode"
      ></TDUpload>
      <div class="flex button-generate">
        <TDButton
          @click="convertQRCode"
          :label="$t('i18nCommon.qrCodeToText.convert')"
        ></TDButton>
        <TDButton
          @click="copyResult"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.qrCodeToText.copy')"
        ></TDButton>
        <TDCheckbox
          v-model="isCompressText"
          :label="$t('i18nCommon.qrCodeToText.compressText')"
          @input="convertQRCode"
        ></TDCheckbox>
      </div>
      <TDTextarea
        class="input-area"
        :placeHolder="$t('i18nCommon.qrCodeToText.result')"
        v-model="textOutput"
        :readOnly="true"
      ></TDTextarea>
    </div>
  </div>
</template>
<script>
import TDCompress from "@/common/compress/TDCompress.js";

export default {
  name: "TDQRCodeToText",
  created() {
    let me = this;
    document.addEventListener("paste", me.handlePasteEvent);
  },
  beforeUnmount() {
    let me = this;
    document.removeEventListener("paste", me.handlePasteEvent);
  },
  mounted() {},
  methods: {
    handlePasteEvent(e) {
      let me = this;
      e.preventDefault();
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.includes("image")) {
          const blob = item.getAsFile();
          if (
            me.$refs.uploadArea &&
            typeof me.$refs.uploadArea.setFileSelected === "function"
          ) {
            me.$refs.uploadArea.setFileSelected(blob);
            me.convertQRCode();
          }
          break;
        }
      }
    },
    handleDragOver(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = true;
    },

    handleDragLeave(e) {
      let me = this;
      e.preventDefault();
      me.isDragOver = false;
    },
    handleDrop(e) {
      e.preventDefault();
      let me = this;
      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.includes("image")
      );

      if (files.length) {
        if (
          me.$refs.uploadArea &&
          typeof me.$refs.uploadArea.setFileSelected === "function"
        ) {
          me.$refs.uploadArea.setFileSelected(files); // truyền mảng files
          me.convertQRCode();
        }
      }
    },
    /**
     * Tạo QR code từ text
     */
    async convertQRCode() {
      let me = this;
      if (
        me.$refs.uploadArea &&
        typeof me.$refs.uploadArea.getFileSelected === "function"
      ) {
        // Lazy-load module
        const { imagesQRToText } = await import(
          /* webpackChunkName: "mock-qr-code-util" */
          "@/common/qrcode/TDQRCodeUtil.js"
        );
        // Lọc kết quả hợp lệ
        let result = await imagesQRToText(me.$refs.uploadArea);
        if (result && result.length > 0) {
          let tempOutput = result.join("");
          if (me.isCompressText) {
            me.textOutput = await TDCompress.decompressText(
              tempOutput,
              me.$tdEnum.compressType.gzip
            );
          } else {
            me.textOutput = tempOutput;
          }
        }
        me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.converted"));
      }
    },

    /**
     * copy kết quả
     */
    copyResult() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.textOutput);
    },
  },
  data() {
    return {
      textOutput: null,
      isRemoveEmpty: false,
      historyItems: [],
      qrCodeItems: [],
      isDragOver: false,
      isCompressText:
        window.__env &&
        window.__env.textToQRConfig &&
        window.__env.textToQRConfig.isCompressText,
    };
  },
};
</script>
<style scoped>
.container {
  height: 100%;
}
.qr-section {
  padding: var(--padding);
  flex: 1;
  width: 100%;
}

.td-img {
  width: 100%;
  max-width: 1000px;
  height: auto;
  padding: var(--padding);
}

.input-area {
  flex: 1;
}
</style>
