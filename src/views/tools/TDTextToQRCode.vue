<template>
  <div class="container">
    <div class="title">Text To QRCode tool!</div>
    <div class="history-section">
      <div class="history-header">
        <h3>Lịch sử</h3>
        <TDButton @click="clearAllHistory" label="Xóa tất cả"></TDButton>
      </div>
      <div ref="history-list" class="history-list">
        <template v-for="(item, index) in historyItems">
          <div class="history-item" @click="applyHistoryText(item.historyId)">
            <span>{{ item.textContent }}</span>
            <button
              class="delete-btn"
              @click.stop.prevent="deleteHistoryItem(item.historyId)"
            >
              x
            </button>
          </div>
        </template>
      </div>
    </div>
    <div class="flex flex-col input-section">
      <TDTextarea
        class="input-area"
        placeHolder="Nhập văn bản để tạo mã QR code..."
        v-model="textGenQR"
      ></TDTextarea>
      <div class="flex button-generate">
        <TDButton
          :readOnly="!textGenQR"
          @click="generateQRCode"
          label="Tạo QR Code"
        ></TDButton>
        <TDButton
          @click="downloadAllQRCodes"
          :type="$tdEnum.buttonType.secondary"
          :readOnly="!qrCodeItems || !qrCodeItems.length"
          label="Tải xuống tất cả"
          class="download-all-btn"
        ></TDButton>
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          label="Example"
        ></TDButton>
        <TDInput
          v-model="maxLengthUserConfig"
          :inputType="'number'"
          class="max-length-input"
          :placeHolder="'Số ký tự tối đa 1 mã QR'"
        />
      </div>
    </div>
    <div v-if="textGenQR" class="qrcode-section">
      <div class="qrcode-box">
        <template v-for="(item, index) in qrCodeItems">
          <div class="qr-container">
            <div class="qr-header">
              <span>{{ `Phần ${index + 1}/${qrCodeItems.length}` }}</span>
              <TDButton
                @click="downloadQRCode(item.src, index)"
                :type="$tdEnum.buttonType.secondary"
                label="Tải xuống"
                class="download-btn"
              ></TDButton>
            </div>
            <img :src="item.src" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
import QRCode from "qrcode";
import JSZip from "jszip";
export default {
  name: "TDTextToQRCode",
  created() {
    let me = this;
    me.updateHistoryDisplay();
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    async applyMock() {
      // Lazy-load module
      const { TDMockTextToQRCode } = await import(
        /* webpackChunkName: "mock-text-to-qr-code" */
        "@/common/mock/TDMockTextToQRCode.js"
      );
      this.$tdUtility.applyMock(this, TDMockTextToQRCode);
    },
    /**
     * Tạo QR code từ text
     */
    async generateQRCode() {
      let me = this;
      let maxTextOneChunk = Number(
        me.maxLengthUserConfig ?? window.__env.textToQRConfig.maxTextOneChunk
      );
      if (!maxTextOneChunk || isNaN(maxTextOneChunk) || maxTextOneChunk <= 0) {
        maxTextOneChunk = 1000; // fallback mặc định
      }

      // Lấy giá trị từ các input
      let text = me.getUserInput();
      let textBuild = me.buildTextBeforeGenQR(text);

      // Lưu text vào lịch sử nếu khác với lần lưu trước
      await me.saveToHistory(text);
      // reset
      me.qrCodeItems = [];
      // Nếu độ dài text lớn hơn 1000, chia thành nhiều phần
      let chunks = me.splitTextIntoChunks(textBuild, maxTextOneChunk);
      // Tạo QR code cho từng phần
      chunks.forEach((chunk) => {
        me.generateQRCodeJS(chunk);
      });
    },

    /**
     * Chia text thành các phần nhỏ hơn với độ dài cho trước
     * @param {string} text - Text cần chia
     * @param {number} maxLength - Độ dài tối đa của mỗi phần
     * @returns {string[]} Mảng các phần text đã chia
     */
    splitTextIntoChunks(text, maxLength) {
      let chunks = [];
      for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.slice(i, i + maxLength));
      }
      return chunks;
    },

    /**
     * Tiền xử lý text trước khi tạo QR code
     */
    buildTextBeforeGenQR(text) {
      let me = this;
      return text;
    },

    /**
     * lấy giá trị từ input text
     * @returns {string} giá trị text từ input
     */
    getUserInput() {
      let me = this;
      let inputElement = me.textGenQR.toString();
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
     * Lấy lịch sử text từ localStorage
     * @returns {Array} Mảng các text đã lưu
     */
    async getHistory() {
      let me = this;
      let history = await me.$tdCache.get(me.$tdEnum.cacheConfig.QRHistory);
      return history ? history : [];
    },

    /**
     * Lưu text vào lịch sử nếu khác với lần lưu trước
     * @param {string} text - Text cần lưu
     */
    async saveToHistory(text) {
      try {
        let me = this;
        let history = await me.getHistory();
        history = history.filter((x) => x.title != text);
        history.push(me.buildHistoryItem(text));
        // Giới hạn số lượng lịch sử lưu trữ
        if (history.length > window.__env.textToQRConfig.maxHistoryLength) {
          history.shift(); // Xóa item cũ nhất
        }
        await me.$tdCache.set(me.$tdEnum.cacheConfig.QRHistory, history);
        await me.updateHistoryDisplay();
      } catch (error) {
        console.error("Lỗi khi lưu vào history:", error);
        // Lỗi sẽ được bỏ qua để không ảnh hưởng tới luồng chính
      }
    },
    buildHistoryItem(text) {
      let me = this;
      return {
        title: text,
        historyId: me.$tdUtility.newGuid(),
      };
    },
    /**
     * Xóa một item khỏi lịch sử
     * @param {number} index - Vị trí của item cần xóa
     */
    async deleteHistoryItem(historyId) {
      let me = this;
      let history = await me.getHistory();
      history = history.filter((x) => x.historyId != historyId);
      await me.$tdCache.set(
        me.$tdEnum.cacheConfig.QRHistory,
        JSON.stringify(history)
      );
      await me.updateHistoryDisplay();
    },

    /**
     * Xóa tất cả lịch sử
     */
    clearAllHistory() {
      let me = this;
      me.$tdCache.remove(me.$tdEnum.cacheConfig.QRHistory);
      me.historyItems = [];
    },

    /**
     * Áp dụng text từ lịch sử
     * @param {string} text - Text cần áp dụng
     */
    applyHistoryText(historyId) {
      let me = this;
      if (me.historyItems && me.historyItems.length > 0 && historyId) {
        let currentItem = me.historyItems.find((x) => x.historyId == historyId);
        if (currentItem) {
          me.textGenQR = currentItem.title;
          me.generateQRCode();
        }
      }
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
     * Tải xuống QR code dưới dạng hình ảnh PNG
     * @param {string} dataUrl - Data URL của QR code
     * @param {number} index - Vị trí của QR code trong danh sách
     */
    downloadQRCode(dataUrl, index) {
      let me = this;
      // Tạo blob và mở popup tải file
      me.$tdUtility.createDownloadFileFromUrl(
        dataUrl,
        `qrcode-part-${index + 1}.png`
      );
    },

    /**
     * Cập nhật hiển thị lịch sử
     */
    async updateHistoryDisplay() {
      let me = this;
      let history = await me.getHistory();
      let titleLength = window.__env.textToQRConfig.maxTitleLength;
      me.historyItems = [];
      [...history].reverse().forEach((historyItem, index) => {
        let text = historyItem.title;
        let item = {};
        let displayText =
          text && text.length > titleLength
            ? text.slice(0, titleLength) + "..."
            : text;
        item.textContent = displayText;
        item.title = text;
        item.historyId = historyItem.historyId;
        me.historyItems.push(item);
      });
    },
  },
  data() {
    return {
      textGenQR: null,
      historyItems: [],
      qrCodeItems: [],
      maxLengthUserConfig: null,
    };
  },
};
</script>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.history-section {
  padding: var(--padding);
  margin: var(--padding);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-header h3 {
  color: var(--text-primary-color);
  margin: 0;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding);
  background-color: var(--bg-sub-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  color: #444;
  max-width: 300px;
  gap: 0.5rem;
}

.history-item span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: var(--text-primary-color);
}

.history-item:hover {
  background-color: var(--bg-hover-color);
  border: 1px solid var(--focus-color);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.1);
}

.history-item .delete-btn {
  background: none;
  border: none;
  color: var(--text-primary-color);
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;
  margin-left: 4px;
}

.history-item .delete-btn:hover {
  color: var(--focus-color);
}

.history-item span:hover {
  color: var(--focus-color);
  text-decoration: underline;
}

.input-section {
  width: 100%;
  justify-content: flex-start;
  align-items: flex-start;
}

.input-area {
  min-height: 100px;
  padding: 0.5rem;
  border-radius: 5px;
  resize: vertical;
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
.button-generate {
  margin-bottom: var(--padding);
}
.qrcode-section {
  margin: var(--padding);
}

.qrcode-box {
  display: grid;
  gap: 3rem;
  justify-content: center;
  align-items: start;
}

/* Grid responsive cho các mã QR */
@media screen and (max-width: 900px) {
  .qrcode-box {
    grid-template-columns: 1fr;
    gap: 4rem;
  }
}

@media screen and (min-width: 901px) and (max-width: 1400px) {
  .qrcode-box {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (min-width: 1401px) and (max-width: 2100px) {
  .qrcode-box {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (min-width: 2101px) {
  .qrcode-box {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Style cho container của từng mã QR */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.qr-header {
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
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
</style>
