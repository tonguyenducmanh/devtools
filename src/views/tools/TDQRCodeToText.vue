<template>
  <div class="container">
    <div class="title">QRCode To Text tool!</div>
    <div class="qr-section">
      <div class="flex">
        <img class="td-img" src="@/assets/qrcodeupload.png" />
      </div>
      <div>
        Note: thứ tự upload dựa vào thứ tự sắp xếp trên máy tính, vui lòng chọn
        sắp xếp theo ngày tăng dần để nối chuỗi đúng file
      </div>
      <br />
      <TDUpload
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        ref="uploadArea"
        class="upload-area"
        maxHeight="200px"
        labelEmpty="Kéo thả ảnh hoặc Ctrl+V ảnh vừa copy vào đây"
        :label="'Chọn ảnh QR code'"
        multiple
      ></TDUpload>
      <div class="flex button-generate">
        <TDButton @click="convertQRCode" label="Chuyển đổi"></TDButton>
        <TDButton
          @click="copyResult"
          :type="$tdEnum.buttonType.secondary"
          label="Copy"
        ></TDButton>
      </div>
      <TDTextarea
        class="input-area"
        placeHolder="Kết quả sẽ xuất hiện sau khi paste ảnh"
        v-model="textOutput"
        :readOnly="true"
        height="200px"
      ></TDTextarea>
    </div>
  </div>
</template>
<script>
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
        const { convertQRCode } = await import(
          /* webpackChunkName: "mock-qr-code-common" */
          "@/common/qrcode/TDQRCodeCommon.js"
        );
        // Lọc kết quả hợp lệ
        let result = await convertQRCode(me.$refs.uploadArea);
        if (result && result.length > 0) {
          me.textOutput = result.join("");
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
  },
  data() {
    return {
      textOutput: null,
      isRemoveEmpty: false,
      historyItems: [],
      qrCodeItems: [],
      isDragOver: false,
    };
  },
};
</script>
<style scoped>
.qr-section {
  padding: var(--padding);
}

.td-img {
  width: 100%;
  max-width: 1000px;
  height: auto;
  padding: var(--padding);
}
</style>
