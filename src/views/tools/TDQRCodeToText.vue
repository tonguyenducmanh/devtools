<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="flex flex-col qr-section">
        <div class="flex tool-qr-header">
          <div class="flex-one">
            <TDUpload
              ref="uploadArea"
              class="upload-area"
              multiple
              @selected="convertQRCode"
            ></TDUpload>
          </div>
          <TDButton
            :noMargin="true"
            @click="convertQRCode"
            :label="$t('i18nCommon.qrCodeToText.convert')"
          ></TDButton>
          <TDButton
            @click="copyResult"
            :noMargin="true"
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
    <TDSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.Help
          "
        >
          <TDQRCodeToTextHelp />
        </div>
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.Setting
          "
        >
          <TDCheckbox
            v-model="currentConfigLayout.isCompressText"
            :variant="$tdEnum.checkboxType.switch"
            :label="$t('i18nCommon.qrCodeToText.compressText')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            v-model="currentConfigLayout.hasHeaderInQR"
            :variant="$tdEnum.checkboxType.switch"
            :label="$t('i18nCommon.qrCodeToText.hasHeaderInQR')"
            @change="updateConfigLayout"
          ></TDCheckbox>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>
<script>
import TDCompress from "@/common/compress/TDCompress.js";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDQRCodeToTextHelp from "@/views/helps/TDQRCodeToTextHelp.vue";
export default {
  extends: TDToolBase,
  name: "TDQRCodeToText",
  components: { TDSubSidebar, TDQRCodeToTextHelp },
  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tdEnum.ToolSidebarOption.Help,
        label: this.$t("i18nCommon.sidebarOption.help"),
        icon: "td-help-icon",
      });
      options.push({
        value: this.$tdEnum.ToolSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "td-setting-icon",
      });
      return options;
    },
  },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    /**
     * Hàm này được gọi khi tab được active hoặc khi component được mount (nếu đang active)
     * Component con cần add event (ví dụ listener trên window/document) thì override lại
     */
    onTabEnter() {
      let me = this;
      document.addEventListener("paste", me.handlePasteEvent);
    },

    /**
     * Hàm này được gọi khi tab bị inactive hoặc trước khi component bị unmount (nếu đang active)
     * Component con cần remove event thì override lại
     */
    onTabLeave() {
      let me = this;
      document.removeEventListener("paste", me.handlePasteEvent);
    },

    /**
     * Xử lý event paste mã QR
     */
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
    /**
     * Tạo QR code từ text
     */
    async convertQRCode() {
      let me = this;
      if (
        me.$refs.uploadArea &&
        typeof me.$refs.uploadArea.getFileSelected === "function"
      ) {
        const { imagesQRToText } = await import(
          /* webpackChunkName: "mock-qr-code-util" */
          "@/common/qrcode/TDQRCodeUtil.js"
        );
        try {
          let rawResults = await imagesQRToText(me.$refs.uploadArea);
          if (rawResults && rawResults.length > 0) {
            let finalOutput = "";
            if (me.currentConfigLayout.hasHeaderInQR) {
              finalOutput = me.recoveryFullTextFromQRWithHeader(rawResults);
            } else {
              finalOutput = rawResults.join("");
            }

            if (me.currentConfigLayout.isCompressText) {
              me.textOutput = await TDCompress.decompressText(
                finalOutput,
                me.$tdEnum.compressType.gzip,
              );
            } else {
              me.textOutput = finalOutput;
            }
          }
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.converted"));
        } catch (error) {
          console.error("Error in convertQRCode:", error);
          me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
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
          "Một số QR code có header, một số thì không. Chỉ các QR có header sẽ được sắp xếp và ghép nối.",
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
        (chunk) => chunk.timestamp === maxTimestamp,
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
      keyCacheLayout: this.$tdEnum.cacheConfig.QRCodeToTextConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.ToolSidebarOption.Help,
        isCompressText:
          window.__env &&
          window.__env.textToQRConfig &&
          window.__env.textToQRConfig.isCompressText,
        hasHeaderInQR: true,
      },
      textOutput: null,
      isRemoveEmpty: false,
      historyItems: [],
      qrCodeItems: [],
    };
  },
};
</script>
<style scoped>
.container {
  height: 100%;
}
.qr-section {
  flex: 1;
  width: 100%;
  height: 100%;
  gap: var(--padding);
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
  width: 100%;
  overflow: auto;
}
.tool-qr-header {
  width: 100%;
  justify-content: space-between;
  gap: var(--padding);
}
</style>
