<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex flex-col input-section" :style="firstSectionResizeStyle">
        <div class="flex input-area">
          <TMTextEditor
            :placeHolder="$t('i18nCommon.textToQRCode.input.placeholder')"
            v-model="textGenQR"
          ></TMTextEditor>
          <div class="flex flex-col button-generate">
            <TMButton
              :noMargin="true"
              :readOnly="!textGenQR || isGenerating"
              @click="generateQRCode(null)"
              iconClass="tm-send-icon"
              v-tooltip="$t('i18nCommon.textToQRCode.buttons.generate')"
            ></TMButton>
            <TMButton
              :noMargin="true"
              @click="downloadAllQRCodes"
              :type="$tmEnum.buttonType.secondary"
              :readOnly="isGenerating || !qrCodeItems || !qrCodeItems.length"
              iconClass="tm-download-icon"
              v-tooltip="$t('i18nCommon.textToQRCode.buttons.downloadAll')"
            ></TMButton>
            <TMButton
              :noMargin="true"
              @click="applyMock"
              :type="$tmEnum.buttonType.secondary"
              iconClass="tm-example-icon"
              v-tooltip="$t('i18nCommon.textToQRCode.buttons.example')"
            ></TMButton>
            <TMButton
              v-if="qrCodeItems && qrCodeItems.length > 0"
              :noMargin="true"
              @click="toggleFullTab"
              :type="$tmEnum.buttonType.secondary"
              iconClass="tm-full-screen-icon"
              v-tooltip="$t('i18nCommon.remoteDesktop.fullTab')"
            ></TMButton>
          </div>
        </div>
        <div class="flex group-footer-input">
          <div>
            {{
              $t("i18nCommon.textToQRCode.totalQRGen").format(
                qrCodeItems.length,
              )
            }}
          </div>
          <div v-if="isGenerating" class="generating-status">
            <span>{{
              $t("i18nCommon.textToQRCode.generatingProgress").format(
                generatedCount,
                totalToGenerate,
              )
            }}</span>
          </div>
        </div>
      </div>
      <!-- Resizer -->
      <TMResizer
        v-if="textGenQR && qrCodeItems && qrCodeItems.length > 0"
        :direction="'vertical'"
        @resize="handleResize"
        :minSize="15"
      />
      <TMFullTabWrapper
        v-model="isFullTab"
        :hidePin="true"
        :style="!isFullTab ? secondSectionResizeStyle : {}"
        class="qrcode-wrapper"
      >
        <div class="qrcode-box">
          <div class="qr-loading" v-if="isGenerating && !qrCodeItems.length">
            <TMLoading />
          </div>
          <TMVirtualScroll
            :items="qrCodeItems"
            :itemHeight="currentConfigLayout.QRSizeInPixel"
            :itemWidth="currentConfigLayout.QRSizeInPixel"
            :gap="10"
            :bufferSize="0"
          >
            <template #default="{ item, index }">
              <div
                class="qr-container"
                :style="QRImageStyle"
                v-tooltip="$t('i18nCommon.copy')"
                @click="copyQRCode(item.src, index)"
              >
                <img :src="item.src" />
              </div>
            </template>
          </TMVirtualScroll>
        </div>
      </TMFullTabWrapper>
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
          <TMTextToQRCodeHelp />
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
            titleKey="textGenQR"
            :noMargin="true"
            :cacheKey="$tmEnum.cacheConfig.TextToQRCodeHistory"
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
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.isCompressText"
            :label="$t('i18nCommon.textToQRCode.compressText')"
            @change="toggleCompressText"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.addHeaderToQR"
            :label="$t('i18nCommon.textToQRCode.addHeaderToQR')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <div class="flex flex-col input-config">
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToQRCode.input.maxLength")
              }}</span>
              <TMInput
                v-model="currentConfigLayout.maxLengthUserConfig"
                :inputType="'number'"
                class="value-input-config max-length-input"
                :placeHolder="'1000'"
                :noMargin="true"
                @clickOutSide="updateConfigLayout"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToQRCode.QRSizeInPixel")
              }}</span>
              <TMInput
                v-model="currentConfigLayout.QRSizeInPixel"
                :inputType="'number'"
                class="value-input-config max-length-input"
                :placeHolder="350"
                :noMargin="true"
                @clickOutSide="updateConfigLayout"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToQRCode.exampleWordCount")
              }}</span>
              <TMInput
                v-model="currentConfigLayout.exampleWordCount"
                :inputType="'number'"
                class="value-input-config max-length-input"
                :placeHolder="10"
                :noMargin="true"
                @clickOutSide="updateConfigLayout"
              />
            </div>
          </div>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
import JSZip from "jszip";
import TMCompress from "@/common/compress/TMCompress.js";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMMockTextGenerate from "@/common/mock/TMMockTextGenerate.js";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMTextToQRCodeHelp from "@/views/helps/TMTextToQRCodeHelp.vue";
import TMFullTabWrapper from "@/components/TMFullTabWrapper.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import { generateQRItems } from "@/common/qrcode/TMQRCodeWorkerClient.js";

// Option sinh QR, giữ nguyên như lúc dùng `qrcode.toDataURL`.
// ĐỂ NGOÀI component (không đặt trong `data()`): Vue sẽ bọc object trong
// `data()` thành reactive Proxy, mà Proxy thì không thể structured-clone để
// postMessage sang worker → DataCloneError.
const QR_GENERATE_OPTIONS = {
  errorCorrectionLevel: "L",
  type: "image/png",
  quality: 1,
  margin: 1,
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
  width: 1000,
};

export default {
  extends: TMToolBase,
  name: "TMTextToQRCode",
  components: {
    TMSubSidebar,
    TMTextToQRCodeHelp,
    TMFullTabWrapper,
    TMHistorySidebar,
  },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  watch: {
    textGenQR(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.textGenQR);
      }
    },
  },
  mounted() {},
  methods: {
    handleResize(sizes) {
      this.firstSectionSize = sizes.leftSize;
      this.secondSectionSize = sizes.rightSize;
    },
    toggleFullTab() {
      this.isFullTab = !this.isFullTab;
      if (!this.isFullTab && document.fullscreenElement) {
        document.exitFullscreen();
      }
    },
    async applyMock() {
      let me = this;
      let dataMock = {
        textGenQR: TMMockTextGenerate.generateLoremWords(
          me.currentConfigLayout.exampleWordCount,
        ),
      };
      this.$tmUtility.applyMock(this, dataMock);
    },
    async toggleCompressText() {
      let me = this;
      if (me.textGenQR) {
        await me.generateQRCode(null);
      }
      me.updateConfigLayout();
    },
    /**
     * Tạo QR code từ text
     *
     * Phần nặng (dựng ma trận + encode PNG cho từng chunk) chạy trong Web Worker
     * `TMQRCodeWorker` nên main thread không bị block: người dùng vẫn gõ text,
     * đổi setting, chuyển tab trong lúc đang sinh ảnh.
     */
    async generateQRCode(textInput) {
      let me = this;
      let maxTextOneChunk = Number(
        me.currentConfigLayout.maxLengthUserConfig ??
          window.__env.textToQRConfig.maxTextOneChunk,
      );
      if (!maxTextOneChunk || isNaN(maxTextOneChunk) || maxTextOneChunk <= 0) {
        maxTextOneChunk = 1000;
      }

      const HEADER_LENGTH = 19;
      let effectiveMaxTextOneChunk = maxTextOneChunk;
      if (me.currentConfigLayout.addHeaderToQR) {
        effectiveMaxTextOneChunk = Math.max(1, maxTextOneChunk - HEADER_LENGTH);
      }

      let text = me.getUserInput(textInput);
      let textBuild = await me.buildTextBeforeGenQR(text);

      let timestamp = me.getCurrentTimestampForHeader();

      let chunks = me.splitTextIntoChunks(
        textBuild,
        effectiveMaxTextOneChunk,
        me.currentConfigLayout.addHeaderToQR,
        timestamp,
      );
      if (chunks.length === 0) {
        return;
      }

      // Token để bỏ qua kết quả của lần generate đã bị thay thế
      const genToken = ++me.generateToken;
      me.totalToGenerate = chunks.length;
      me.generatedCount = 0;
      me.qrCodeItems = [];
      me.isGenerating = true;

      try {
        const { items, errors } = await generateQRItems(
          chunks.map((chunk, index) => ({ index, text: chunk })),
          QR_GENERATE_OPTIONS,
          ({ index, src }) => {
            if (me.generateToken !== genToken) return;
            // Hiển thị dần từng mã thay vì đợi sinh xong hết
            me.qrCodeItems[index] = { src };
            me.generatedCount = me.qrCodeItems.length;
          },
        );

        if (me.generateToken !== genToken) return;

        if (errors && errors.length) {
          me.$tmToast.error(me.$t("i18nCommon.textToQRCode.generateError"));
        }
        // Chốt lại theo đúng thứ tự chunk, bỏ các mã sinh lỗi
        me.qrCodeItems = items
          .slice()
          .sort((a, b) => a.index - b.index)
          .map((item) => ({ src: item.src }));
        me.generatedCount = me.qrCodeItems.length;

        await me.saveToHistory(text);
        me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Error in generateQRCode:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      } finally {
        if (me.generateToken === genToken) {
          me.isGenerating = false;
        }
      }
    },

    /**
     * Lưu text đã generate QR code vào lịch sử
     * @param {string} text - Text đã generate
     */
    async saveToHistory(text) {
      let me = this;
      if (me.$refs.history && text) {
        let historyItem = {
          textGenQR: text,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },

    /**
     * Áp dụng text từ lịch sử
     * @param {Object|string} item - Item lịch sử
     */
    async handleApplyHistory(item) {
      let me = this;
      let text = typeof item === "string" ? item : item && item.textGenQR;
      if (text) {
        me.textGenQR = text;
        await me.generateQRCode(text);
      }
    },

    /**
     * Chia text thành các phần nhỏ hơn với độ dài cho trước
     * @param {string} text - Text cần chia
     * @param {number} maxLength - Độ dài tối đa của mỗi phần
     * @param {boolean} addHeader - Có thêm header vào mỗi chunk hay không
     * @param {string} timestamp - Timestamp để thêm vào header
     * @returns {string[]} Mảng các phần text đã chia
     */
    splitTextIntoChunks(text, maxLength, addHeader, timestamp) {
      let chunks = [];
      for (let i = 0; i < text.length; i += maxLength) {
        let chunk = text.slice(i, i + maxLength);
        if (addHeader) {
          const index = (chunks.length + 1).toString().padStart(3, "0"); // Số thứ tự 3 chữ số
          chunk = `${timestamp}-${index}-${chunk}`;
        }
        chunks.push(chunk);
      }
      return chunks;
    },

    /**
     * Tiền xử lý text trước khi tạo QR code
     */
    async buildTextBeforeGenQR(text) {
      let me = this;
      let textTransformed = text;
      if (me.currentConfigLayout.isCompressText && textTransformed) {
        textTransformed = await TMCompress.compressText(
          text,
          me.$tmEnum.compressType.gzip,
        );
      }
      return textTransformed;
    },

    /**
     * lấy giá trị từ input text
     * @returns {string} giá trị text từ input
     */
    getUserInput(textInput) {
      let me = this;
      let inputElement = textInput ? textInput : me.textGenQR.toString();
      if (textInput) {
        me.textGenQR = textInput;
      }
      let text = inputElement ? inputElement.trim() : null;
      return text;
    },

    /**
     * Copy ảnh từ url
     * @param {string} dataUrl - Data URL của QR code
     */
    copyQRCode(dataUrl, index) {
      let me = this;
      // Tạo blob và mở popup tải file
      me.$tmUtility.copyImageFromUrl(dataUrl);
    },
    /**
     * Chuyển đổi Data URL thành Blob
     * @param {string} dataUrl - Data URL cần chuyển đổi
     * @returns {Blob} Blob data
     */
    dataURLtoBlob(dataUrl) {
      const arr = dataUrl.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    },

    /**
     * Tải xuống tất cả QR codes dưới dạng tệp ZIP
     */
    async downloadAllQRCodes() {
      let me = this;
      const zip = new JSZip();

      // Thêm từng QR code vào ZIP
      this.qrCodeItems.forEach((item, index) => {
        const blob = this.dataURLtoBlob(item.src);
        zip.file(`qrcode-part-${index + 1}.png`, blob);
      });

      // Tạo và tải xuống tệp ZIP
      const content = await zip.generateAsync({ type: "blob" });
      // Tạo blob và mở popup tải file
      me.$tmUtility.createDownloadFileFromBlob(content, "qrcodes.zip");
    },

    /**
     * Lấy timestamp hiện tại để thêm vào header
     * @returns {string} Timestamp định dạng YYYYMMDDHHmmss
     */
    getCurrentTimestampForHeader() {
      let now = new Date();
      let timestamp =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0");
      return timestamp;
    },
    /**
     * Cấu hình lifecycle tab: đăng ký keydown event
     */
    getTabLifecycleConfig() {
      let me = this;
      return {
        shortcuts: [],
        domEvents: [{ event: "keydown", handler: me.handleKeydownEvent }],
      };
    },
    handleKeydownEvent(event) {
      let me = this;
      // nếu ấn esc thì đóng full tab
      if (event.key === "Escape" && me.isFullTab) {
        me.toggleFullTab();
      }
    },
  },
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
    QRImageStyle() {
      let me = this;
      let style = {
        width: `${me.currentConfigLayout.QRSizeInPixel}px`,
        height: `${me.currentConfigLayout.QRSizeInPixel}px`,
      };
      return style;
    },
    /**
     * Tính toán style động cho request area
     */
    firstSectionResizeStyle() {
      let me = this;
      let style = { height: `${me.firstSectionSize}%` };
      return style;
    },
    /**
     * Tính toán style động cho response area
     */
    secondSectionResizeStyle() {
      let me = this;
      let style = { height: `${me.secondSectionSize}%` };
      return style;
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.TextToQRCodeConfigLayout,
      currentConfigLayout: {
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        isShowSidebar: true,
        maxLengthUserConfig: window.__env.textToQRConfig.maxTextOneChunk,
        QRSizeInPixel: 300,
        exampleWordCount: 10,
        isCompressText:
          window.__env &&
          window.__env.textToQRConfig &&
          window.__env.textToQRConfig.isCompressText,
        addHeaderToQR: true,
      },
      firstSectionSize: 35,
      secondSectionSize: 65,
      textGenQR: null,
      qrCodeItems: [],
      isFullTab: false,
      isGenerating: false,
      generatedCount: 0,
      totalToGenerate: 0,
      generateToken: 0,
    };
  },
};
</script>
<style scoped lang="scss">
.container {
  display: flex;
  width: 100%;
  height: 100%;
}
.main-tool {
  height: 100%;
  width: 100%;
  justify-content: flex-start;
}

.input-section {
  width: 100%;
  justify-content: flex-start;
  align-items: flex-start;
}

.qr-section {
  width: 100%;
}

.input-area {
  width: 100%;
  height: 100%;
  flex: 1;
  gap: var(--padding);
}
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.checkbox-wrapper label {
  color: #333;
  cursor: pointer;
}

.qrcode-wrapper {
  background: var(--bg-main-color);
}

.qrcode-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap; /* cho phép xuống hàng */
  gap: var(--padding);
  justify-content: flex-start; /* hoặc center nếu muốn */
  align-items: flex-start;
}
/* Style cho container của từng mã QR */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.download-btn {
  margin-left: 1rem;
}

.qr-container canvas,
.qr-container img {
  min-width: 100%;
  max-width: 100%;
  height: auto;
}
.title {
  margin-bottom: unset;
}
.tm-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}
.input-config {
  width: 100%;
  gap: var(--padding);
  .input-config-item {
    justify-content: space-between;
    width: 100%;
    padding: 0 var(--padding);
    box-sizing: border-box;
    .title-input-config {
      flex: 1;
    }
    .value-input-config {
      width: 100px;
    }
  }
}
.group-footer-input {
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin: var(--padding) 0;
}
.generating-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--padding);
  color: var(--text-secondary-color);
  white-space: nowrap;
}
.qr-loading {
  width: 100%;
  align-items: center;
  justify-content: center;
}
.button-generate {
  justify-content: flex-start;
  height: 100%;
  gap: var(--padding);
}
</style>
