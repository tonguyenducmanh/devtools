<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="flex flex-col qr-section">
        <div class="flex tool-qr-header">
          <div class="flex-one">
            <TMUpload
              ref="uploadArea"
              class="upload-area"
              multiple
              :labelEmpty="$t('i18nCommon.qrCodeToText.uploadLabel')"
              @selected="convertQRCode"
            ></TMUpload>
          </div>
          <TMButton
            :noMargin="true"
            @click="convertQRCode"
            iconClass="tm-send-icon"
            v-tooltip="$t('i18nCommon.qrCodeToText.convert')"
          ></TMButton>
          <TMButton
            @click="copyResult"
            :noMargin="true"
            :type="$tmEnum.buttonType.secondary"
            iconClass="tm-copy-icon"
            v-tooltip="$t('i18nCommon.qrCodeToText.copy')"
          ></TMButton>
        </div>
        <div class="flex flex-col response-loading" v-if="isLoading">
          <TMLoading />
        </div>
        <TMTextEditor
          v-else
          class="input-area"
          :placeHolder="$t('i18nCommon.qrCodeToText.result')"
          v-model="textOutput"
          :readOnly="true"
        ></TMTextEditor>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
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
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Help
          "
        >
          <TMQRCodeToTextHelp />
        </div>
        <div
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            :noMargin="true"
            :cacheKey="$tmEnum.cacheConfig.QRCodeToTextHistory"
          />
        </div>
        <div
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Setting
          "
        >
          <TMCheckbox
            v-model="currentConfigLayout.isCompressText"
            :variant="$tmEnum.checkboxType.switch"
            :label="$t('i18nCommon.qrCodeToText.compressText')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            v-model="currentConfigLayout.hasHeaderInQR"
            :variant="$tmEnum.checkboxType.switch"
            :label="$t('i18nCommon.qrCodeToText.hasHeaderInQR')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            v-model="currentConfigLayout.scanMultipleQR"
            :variant="$tmEnum.checkboxType.switch"
            :label="$t('i18nCommon.qrCodeToText.scanMultipleQR')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
import TMCompress from "@/common/compress/TMCompress.js";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMQRCodeToTextHelp from "@/views/helps/TMQRCodeToTextHelp.vue";
export default {
  extends: TMToolBase,
  name: "TMQRCodeToText",
  components: { TMSubSidebar, TMQRCodeToTextHelp, TMHistorySidebar },
  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Help,
        label: this.$t("i18nCommon.sidebarOption.help"),
        icon: "tm-help-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.History,
        label: this.$t("i18nCommon.history.title"),
        icon: "tm-history-icon",
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
     * Cấu hình lifecycle tab: đăng ký paste event
     */
    getTabLifecycleConfig() {
      let me = this;
      return {
        shortcuts: [],
        domEvents: [{ event: "paste", handler: me.handlePasteEvent }],
      };
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
        me.isLoading = true;
        const { imagesQRToText } = await import(
          /* webpackChunkName: "mock-qr-code-util" */
          "@/common/qrcode/TMQRCodeUtil.js"
        );
        try {
          let rawResults = await imagesQRToText(me.$refs.uploadArea, {
            scanMultipleQR: me.currentConfigLayout.scanMultipleQR,
          });
          if (rawResults && rawResults.length > 0) {
            let finalOutput = "";
            if (me.currentConfigLayout.hasHeaderInQR) {
              finalOutput = me.recoveryFullTextFromQRWithHeader(rawResults);
            } else {
              finalOutput = rawResults.join("");
            }

            if (me.currentConfigLayout.isCompressText) {
              me.textOutput = await TMCompress.decompressText(
                finalOutput,
                me.$tmEnum.compressType.gzip,
              );
            } else {
              me.textOutput = finalOutput;
            }
            await me.saveToHistory(me.textOutput);
          }
          me.$tmToast.success(me.$t("i18nCommon.toastMessage.converted"));
        } catch (error) {
          console.error("Error in convertQRCode:", error);
          me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
        } finally {
          me.isLoading = false;
        }
      }
    },

    /**
     * Lưu text đã đọc từ QR code vào lịch sử
     * @param {string} text - Text đã đọc được
     */
    async saveToHistory(text) {
      let me = this;
      if (me.$refs.history && text) {
        let historyItem = {
          qrCodeToText: text,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },

    /**
     * Áp dụng text từ lịch sử
     * @param {Object|string} item - Item lịch sử
     */
    handleApplyHistory(item) {
      let me = this;
      let text = typeof item === "string" ? item : item && item.qrCodeToText;
      if (text) {
        me.textOutput = text;
      }
    },

    /**
     * copy kết quả
     */
    copyResult() {
      let me = this;
      me.$tmUtility.copyToClipboard(me.textOutput);
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
      isLoading: false,
      keyCacheLayout: this.$tmEnum.cacheConfig.QRCodeToTextConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        isCompressText:
          window.__env &&
          window.__env.textToQRConfig &&
          window.__env.textToQRConfig.isCompressText,
        hasHeaderInQR: true,
        scanMultipleQR: true,
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

.tm-img {
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
.tm-sub-sidebar {
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
.response-loading {
  width: 100%;
  height: 100%;
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
}
</style>
