<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex flex-col input-section" :style="firstSectionResizeStyle">
        <div class="input-area">
          <TDTextarea
            :placeHolder="$t('i18nCommon.textToQRCode.input.placeholder')"
            v-model="textGenQR"
          ></TDTextarea>
        </div>
        <div class="flex group-footer-input">
          <div class="flex button-generate">
            <TDButton
              :noMargin="true"
              :readOnly="!textGenQR"
              @click="generateQRCode(null)"
              :label="$t('i18nCommon.textToQRCode.buttons.generate')"
            ></TDButton>
            <TDButton
              :noMargin="true"
              @click="downloadAllQRCodes"
              :type="$tdEnum.buttonType.secondary"
              :readOnly="!qrCodeItems || !qrCodeItems.length"
              :label="$t('i18nCommon.textToQRCode.buttons.downloadAll')"
              class="download-all-btn"
            ></TDButton>
            <TDButton
              :noMargin="true"
              @click="applyMock"
              :type="$tdEnum.buttonType.secondary"
              :label="$t('i18nCommon.textToQRCode.buttons.example')"
            ></TDButton>
          </div>
          <div v-if="qrCodeItems && qrCodeItems.length > 0">
            {{
              $t("i18nCommon.textToQRCode.totalQRGen").format(
                qrCodeItems.length,
              )
            }}
          </div>
        </div>
      </div>
      <!-- Resizer -->
      <TDResizer
        v-if="textGenQR && qrCodeItems && qrCodeItems.length > 0"
        :direction="'vertical'"
        @resize="handleResize"
        :minSize="15"
      />
      <div class="qrcode-box" :style="secondSectionResizeStyle">
        <TDVirtualScroll
          :items="qrCodeItems"
          :itemHeight="QRSizeInPixel"
          :itemWidth="QRSizeInPixel"
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
        </TDVirtualScroll>
      </div>
    </div>
    <TDSubSidebar v-model="isShowSidebar">
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
            :showIcon="true"
            v-model="currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="currentSidebarOption == $tdEnum.ToolSidebarOption.Help"
        >
          <TDTextToQRCodeHelp />
        </div>
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="currentSidebarOption == $tdEnum.ToolSidebarOption.Setting"
        >
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="isCompressText"
            :label="$t('i18nCommon.textToQRCode.compressText')"
            @input="toggleCompressText"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="addHeaderToQR"
            :label="$t('i18nCommon.textToQRCode.addHeaderToQR')"
          ></TDCheckbox>
          <div class="flex flex-col input-config">
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToQRCode.input.maxLength")
              }}</span>
              <TDInput
                v-model="maxLengthUserConfig"
                :inputType="'number'"
                class="value-input-config max-length-input"
                :placeHolder="'1000'"
                :noMargin="true"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToQRCode.QRSizeInPixel")
              }}</span>
              <TDInput
                v-model="QRSizeInPixel"
                :inputType="'number'"
                class="value-input-config max-length-input"
                :placeHolder="350"
                :noMargin="true"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToQRCode.exampleWordCount")
              }}</span>
              <TDInput
                v-model="exampleWordCount"
                :inputType="'number'"
                class="value-input-config max-length-input"
                :placeHolder="10"
                :noMargin="true"
              />
            </div>
          </div>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>
<script>
import QRCode from "qrcode";
import JSZip from "jszip";
import TDCompress from "@/common/compress/TDCompress.js";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDMockTextGenerate from "@/common/mock/TDMockTextGenerate.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDTextToQRCodeHelp from "@/views/helps/TDTextToQRCodeHelp.vue";
export default {
  extends: TDToolBase,
  name: "TDTextToQRCode",
  components: { TDSubSidebar, TDTextToQRCodeHelp },
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
    async applyMock() {
      let me = this;
      let dataMock = {
        textGenQR: TDMockTextGenerate.generateLoremWords(me.exampleWordCount),
      };
      this.$tdUtility.applyMock(this, dataMock);
    },
    async toggleCompressText() {
      let me = this;
      if (me.textGenQR) {
        await me.generateQRCode(null);
      }
    },
    /**
     * Tạo QR code từ text
     */
    async generateQRCode(textInput) {
      let me = this;
      let maxTextOneChunk = Number(
        me.maxLengthUserConfig ?? window.__env.textToQRConfig.maxTextOneChunk,
      );
      if (!maxTextOneChunk || isNaN(maxTextOneChunk) || maxTextOneChunk <= 0) {
        maxTextOneChunk = 1000; // fallback mặc định
      }

      // Nếu có header, giảm maxLength đi 19 ký tự (độ dài của YYYYMMDDHHmmss-NNN-)
      const HEADER_LENGTH = 19;
      let effectiveMaxTextOneChunk = maxTextOneChunk;
      if (me.addHeaderToQR) {
        effectiveMaxTextOneChunk = Math.max(1, maxTextOneChunk - HEADER_LENGTH); // Đảm bảo không nhỏ hơn 1
      }

      // Lấy giá trị từ các input
      let text = me.getUserInput(textInput);
      let textBuild = await me.buildTextBeforeGenQR(text);
      // reset
      me.qrCodeItems = [];

      // build ra ngày giờ hiện tại để thêm vào header
      let timestamp = me.getCurrentTimestampForHeader();

      // Nếu độ dài text lớn hơn 1000, chia thành nhiều phần
      let chunks = me.splitTextIntoChunks(
        textBuild,
        effectiveMaxTextOneChunk,
        me.addHeaderToQR,
        timestamp,
      );
      // Tạo QR code cho từng phần
      chunks.forEach((chunk) => {
        me.generateQRCodeJS(chunk);
      });
      me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
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
      if (me.isCompressText && textTransformed) {
        textTransformed = await TDCompress.compressText(
          text,
          me.$tdEnum.compressType.gzip,
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
     * Tạo QR code bằng thư viện qrcode.js
     */
    generateQRCodeJS(textBuild) {
      let me = this;
      let opts = {
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
      let result = {};
      QRCode.toDataURL(textBuild, opts, function (err, url) {
        if (err) throw err;
        result.src = url;
      });
      me.qrCodeItems.push(result);
    },
    /**
     * Copy ảnh từ url
     * @param {string} dataUrl - Data URL của QR code
     */
    copyQRCode(dataUrl, index) {
      let me = this;
      // Tạo blob và mở popup tải file
      me.$tdUtility.copyImageFromUrl(dataUrl);
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
      me.$tdUtility.createDownloadFileFromBlob(content, "qrcodes.zip");
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
  },
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
    QRImageStyle() {
      let me = this;
      let style = {
        width: `${me.QRSizeInPixel}px`,
        height: `${me.QRSizeInPixel}px`,
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
      currentSidebarOption: this.$tdEnum.ToolSidebarOption.Setting,
      firstSectionSize: 50, // Phần request chiếm 50%
      secondSectionSize: 50, // Phần response chiếm 50%
      isShowSidebar: true,
      textGenQR: null,
      qrCodeItems: [],
      maxLengthUserConfig: window.__env.textToQRConfig.maxTextOneChunk,
      QRSizeInPixel: 350,
      exampleWordCount: 10,
      isCompressText:
        window.__env &&
        window.__env.textToQRConfig &&
        window.__env.textToQRConfig.isCompressText,
      addHeaderToQR: true,
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
  flex: 1;
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

.qrcode-box {
  width: 100%;
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
.td-sub-sidebar {
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
  margin: var(--padding) 0;
  .button-generate {
    gap: var(--padding);
  }
}
</style>
