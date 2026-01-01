<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="flex flex-col qr-section">
        <div style="width: 100%">
          <TDUpload
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            ref="uploadArea"
            class="upload-area"
            :labelEmpty="$t('i18nCommon.qrCodeToText.dropZone.placeholder')"
            :label="$t('i18nCommon.qrCodeToText.dropZone.label')"
            multiple
            @selected="convertQRCode"
          ></TDUpload>
        </div>
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
        </div>
        <TDTextarea
          class="input-area"
          :placeHolder="$t('i18nCommon.qrCodeToText.result')"
          v-model="textOutput"
          :readOnly="true"
        ></TDTextarea>
      </div>
    </div>
    <TDSubSidebar v-model="isShowSidebar">
      <div class="flex flex-col td-sub-sidebar">
        <TDCheckbox
          v-model="isCompressText"
          :variant="$tdEnum.checkboxType.switch"
          :label="$t('i18nCommon.qrCodeToText.compressText')"
          @input="convertQRCode"
        ></TDCheckbox>
        <TDCheckbox
          v-model="hasHeaderInQR"
          :variant="$tdEnum.checkboxType.switch"
          :label="$t('i18nCommon.qrCodeToText.hasHeaderInQR')"
          @input="convertQRCode"
        ></TDCheckbox>
      </div>
    </TDSubSidebar>
  </div>
</template>
<script>
import TDCompress from "@/common/compress/TDCompress.js";
import TDSubSidebar from "@/components/TDSubSidebar.vue";

export default {
  name: "TDQRCodeToText",
  components: { TDSubSidebar },
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
        try {
          let rawResults = await imagesQRToText(me.$refs.uploadArea);
          if (rawResults && rawResults.length > 0) {
            let finalOutput = "";
            if (me.hasHeaderInQR) {
              finalOutput = me.recoveryFullTextFromQRWithHeader(rawResults);
            } else {
              // Nếu không có header nào hoặc checkbox không được chọn, nối trực tiếp như cũ
              finalOutput = rawResults.join("");
            }

            if (me.isCompressText) {
              me.textOutput = await TDCompress.decompressText(
                finalOutput,
                me.$tdEnum.compressType.gzip
              );
            } else {
              me.textOutput = finalOutput;
            }
          }
          me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.converted"));
        } catch (error) {
          console.error("Error in convertQRCode:", error);
          me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
        }
      }
    },

    /**
     * copy kết quả
     */
    copyResult() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.textOutput);
    },

    /**
     * Phục hồi văn bản đầy đủ từ các kết quả QR code có header
     * @param {Array} rawResults Mảng các chuỗi văn bản từ QR code
     * @returns {String} Văn bản đầy đủ đã được phục hồi và sắp xếp
     */
    recoveryFullTextFromQRWithHeader(rawResults) {
      let headerRegex = /^(\d{14})-(\d{3})-/; // Regex để khớp với header: YYYYMMDDHHmmss-NNN-

      let finalOutput = "";
      let processedChunks = rawResults.map((chunk) => {
        let match = chunk.match(headerRegex);
        if (match) {
          let timestamp = match[1];
          let index = parseInt(match[2], 10);
          let content = chunk.substring(match[0].length);
          return { timestamp, index, content, hasHeader: true };
        }
        return { content: chunk, hasHeader: false };
      });
      // Lọc ra các chunk có header để sắp xếp
      let chunksWithHeader = processedChunks.filter((chunk) => chunk.hasHeader);

      // Nếu có cả chunk có header và không có header, có thể có lỗi hoặc dữ liệu không nhất quán.
      if (chunksWithHeader.length !== rawResults.length) {
        console.warn(
          "Một số QR code có header, một số thì không. Chỉ các QR có header sẽ được sắp xếp và ghép nối."
        );
      }

      // Tìm timestamp lớn nhất, tránh trường hợp user chọn nhiều qr code từ các lần gen khác nhau
      let maxTimestamp = "";
      if (chunksWithHeader.length > 0) {
        maxTimestamp = chunksWithHeader.reduce((maxTs, chunk) => {
          return chunk.timestamp > maxTs ? chunk.timestamp : maxTs;
        }, chunksWithHeader[0].timestamp);
      }

      // Lọc chỉ những chunk có timestamp lớn nhất
      let latestChunks = chunksWithHeader.filter(
        (chunk) => chunk.timestamp === maxTimestamp
      );

      // Sắp xếp theo timestamp và index
      latestChunks.sort((a, b) => {
        if (a.timestamp !== b.timestamp) {
          return a.timestamp.localeCompare(b.timestamp);
        }
        return a.index - b.index;
      });
      finalOutput = latestChunks.map((chunk) => chunk.content).join("");
      return finalOutput;
    },
  },
  data() {
    return {
      isShowSidebar: true,
      textOutput: null,
      isRemoveEmpty: false,
      historyItems: [],
      qrCodeItems: [],
      isDragOver: false,
      isCompressText:
        window.__env &&
        window.__env.textToQRConfig &&
        window.__env.textToQRConfig.isCompressText,
      hasHeaderInQR: true,
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
.main-tool {
  flex: 1;
  height: 100%;
}
.td-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
}
</style>
