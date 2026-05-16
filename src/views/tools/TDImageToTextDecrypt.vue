<template>
  <div class="flex container">
    <div class="main-tool">
      <div class="flex flex-col qr-section">
        <div class="flex tool-qr-header">
          <div class="flex-one">
            <TDUpload
              ref="uploadArea"
              class="upload-area"
              :labelEmpty="$t('i18nCommon.imageToTextDecrypt.uploadLabel')"
              @selected="convertImage"
            ></TDUpload>
          </div>
          <TDButton
            :noMargin="true"
            @click="convertImage"
            iconClass="td-send-icon"
            v-tooltip="$t('i18nCommon.imageToTextDecrypt.convert')"
          ></TDButton>
          <TDButton
            @click="copyResult"
            :noMargin="true"
            :type="$tdEnum.buttonType.secondary"
            iconClass="td-copy-icon"
            v-tooltip="$t('i18nCommon.imageToTextDecrypt.copy')"
          ></TDButton>
        </div>
        <div class="flex flex-col response-loading" v-if="isLoading">
          <div class="loader"></div>
        </div>
        <TDTextarea
          v-else
          class="input-area"
          :placeHolder="$t('i18nCommon.imageToTextDecrypt.result')"
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
          <TDImageToTextDecryptHelp />
        </div>
        <div
          class="flex flex-col td-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.Setting
          "
        >
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.autoCropBackground"
            :label="$t('i18nCommon.imageToTextDecrypt.autoCropBackground')"
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
import TDImageToTextDecryptHelp from "@/views/helps/TDImageToTextDecryptHelp.vue";

export default {
  extends: TDToolBase,
  name: "TDImageToTextDecrypt",
  components: { TDSubSidebar, TDImageToTextDecryptHelp },
  data() {
    return {
      isLoading: false,
      isFullTab: false,
      keyCacheLayout: this.$tdEnum.cacheConfig.ImageToTextDecryptConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.ToolSidebarOption.Setting,
        autoCropBackground: true,
      },
      textOutput: null,
    };
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
  },
  methods: {
    onTabEnter() {
      document.addEventListener("paste", this.handlePasteEvent);
    },
    onTabLeave() {
      document.removeEventListener("paste", this.handlePasteEvent);
    },
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
            me.convertImage();
          }
          break;
        }
      }
    },
    async convertImage() {
      let me = this;
      if (
        me.$refs.uploadArea &&
        typeof me.$refs.uploadArea.getFileSelected === "function"
      ) {
        let files = me.$refs.uploadArea.getFileSelected();
        if (!files || files.length === 0) return;

        let file = files[0];
        me.isLoading = true;

        try {
          const imageObj = new Image();
          const objectUrl = URL.createObjectURL(file);
          imageObj.src = objectUrl;

          await new Promise((resolve, reject) => {
            imageObj.onload = resolve;
            imageObj.onerror = reject;
          });

          URL.revokeObjectURL(objectUrl);

          const canvas = document.createElement("canvas");
          canvas.width = imageObj.width;
          canvas.height = imageObj.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(imageObj, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          const matchColor = (index, r, g, b, tol = 15) => {
            return (
              Math.abs(data[index] - r) <= tol &&
              Math.abs(data[index + 1] - g) <= tol &&
              Math.abs(data[index + 2] - b) <= tol
            );
          };

          let found = false;
          let startX = 0,
            startY = 0;
          let effectiveBlockSize = 0;

          // Signature is Hot Pink (255, 0, 128)
          // Wide tolerance to handle VM screenshot DPI scaling & JPEG compression
          const isSignature = (idx) => {
            return (
              data[idx] >= 140 &&
              data[idx + 1] <= 110 &&
              data[idx + 2] >= 30 &&
              data[idx + 2] <= 220 &&
              data[idx] > data[idx + 1] + 50
            );
          };

          // Estimate run length using median of multiple scan lines for robustness
          const estimateRunLength = (sx, sy, isHorizontal) => {
            let samples = [];
            for (let s = 0; s < 6; s++) {
              let runLen = 0;
              if (isHorizontal) {
                let scanY = sy + s;
                if (scanY >= canvas.height) break;
                for (let tx = sx; tx < canvas.width; tx++) {
                  if (isSignature((scanY * canvas.width + tx) * 4)) runLen++;
                  else break;
                }
              } else {
                let scanX = sx + s;
                if (scanX >= canvas.width) break;
                for (let ty = sy; ty < canvas.height; ty++) {
                  if (isSignature((ty * canvas.width + scanX) * 4)) runLen++;
                  else break;
                }
              }
              if (runLen > 0) samples.push(runLen);
            }
            if (samples.length === 0) return 0;
            samples.sort((a, b) => a - b);
            return samples[Math.floor(samples.length / 2)];
          };

          for (let y = 0; y < canvas.height && !found; y++) {
            for (let x = 0; x < canvas.width && !found; x++) {
              let idx = (y * canvas.width + x) * 4;
              if (isSignature(idx)) {
                // Use multi-line median for robust block size under DPI scaling
                let bw = estimateRunLength(x, y, true);
                let bh = estimateRunLength(x, y, false);

                let ebs = Math.round((bw + bh) / 2);
                if (ebs >= 1) {
                  // Verify pixel 1 (Version=1 → R=0, G=17): sample area with median
                  let cx = Math.floor(x + ebs * 1.5);
                  let cy = Math.floor(y + ebs * 0.5);
                  if (cx < canvas.width && cy < canvas.height) {
                    let sr = Math.max(1, Math.floor(ebs / 4));
                    let rVals = [], gVals = [];
                    for (let dy = -sr; dy <= sr; dy++) {
                      for (let dx = -sr; dx <= sr; dx++) {
                        let spx = Math.min(Math.max(cx + dx, 0), canvas.width - 1);
                        let spy = Math.min(Math.max(cy + dy, 0), canvas.height - 1);
                        let pidx = (spy * canvas.width + spx) * 4;
                        rVals.push(data[pidx]);
                        gVals.push(data[pidx + 1]);
                      }
                    }
                    rVals.sort((a, b) => a - b);
                    gVals.sort((a, b) => a - b);
                    let pr = rVals[Math.floor(rVals.length / 2)];
                    let pg = gVals[Math.floor(gVals.length / 2)];
                    let high = Math.round(pr / 17);
                    let low = Math.round(pg / 17);
                    if (high === 0 && low === 1) {
                      found = true;
                      startX = x;
                      startY = y;
                      effectiveBlockSize = ebs;
                    }
                  }
                }
              }
            }
          }

          if (!found) {
            throw new Error(
              "Không tìm thấy khối màu hồng Signature góc trên cùng bên trái. Vui lòng thử lại!",
            );
          }

          const getByteAtPixel = (col, row) => {
            let cx = Math.floor(
              startX + col * effectiveBlockSize + effectiveBlockSize / 2,
            );
            let cy = Math.floor(
              startY + row * effectiveBlockSize + effectiveBlockSize / 2,
            );
            if (cx >= canvas.width) cx = canvas.width - 1;
            if (cy >= canvas.height) cy = canvas.height - 1;

            // Multi-point median sampling: robust against JPEG compression & bilinear scaling
            const sr = Math.max(1, Math.floor(effectiveBlockSize / 4));
            let rVals = [], gVals = [];
            for (let dy = -sr; dy <= sr; dy++) {
              for (let dx = -sr; dx <= sr; dx++) {
                let spx = Math.min(Math.max(cx + dx, 0), canvas.width - 1);
                let spy = Math.min(Math.max(cy + dy, 0), canvas.height - 1);
                let index = (spy * canvas.width + spx) * 4;
                rVals.push(data[index]);
                gVals.push(data[index + 1]);
              }
            }
            rVals.sort((a, b) => a - b);
            gVals.sort((a, b) => a - b);
            let pr = rVals[Math.floor(rVals.length / 2)];
            let pg = gVals[Math.floor(gVals.length / 2)];
            let high = Math.round(pr / 17);
            let low = Math.round(pg / 17);
            if (high < 0) high = 0;
            if (high > 15) high = 15;
            if (low < 0) low = 0;
            if (low > 15) low = 15;
            return (high << 4) | low;
          };

          let version = getByteAtPixel(1, 0);
          let isCompress = getByteAtPixel(2, 0);
          let dataLen =
            (getByteAtPixel(3, 0) << 24) |
            (getByteAtPixel(4, 0) << 16) |
            (getByteAtPixel(5, 0) << 8) |
            getByteAtPixel(6, 0);
          dataLen = dataLen >>> 0;

          let totalPixels = 7 + dataLen;
          let gridWidth = Math.max(8, Math.ceil(Math.sqrt(totalPixels)));

          let dataBytes = new Uint8Array(dataLen);
          for (let i = 0; i < dataLen; i++) {
            let pIdx = i + 7;
            let c = pIdx % gridWidth;
            let r = Math.floor(pIdx / gridWidth);
            dataBytes[i] = getByteAtPixel(c, r);
          }

          if (isCompress === 1) {
            let base64Str = me.$tdUtility.arrayBufferToBase64(dataBytes.buffer);
            me.textOutput = await TDCompress.decompressText(
              base64Str,
              me.$tdEnum.compressType.gzip,
            );
          } else {
            me.textOutput = new TextDecoder().decode(dataBytes);
          }

          me.$tdToast.success(me.$t("i18nCommon.toastMessage.converted"));
        } catch (error) {
          console.error("Error in convertImage:", error);
          me.$tdToast.error(
            error.message || me.$t("i18nCommon.toastMessage.error"),
          );
        } finally {
          me.isLoading = false;
        }
      }
    },
    copyResult() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.textOutput);
    },
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
.response-loading {
  width: 100%;
  height: 100%;
  background-color: var(--bg-layer-color);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  justify-content: center;
  align-items: center;
}
.input-config {
  width: 100%;
  gap: var(--padding);
}
.input-config-item {
  justify-content: space-between;
  width: 100%;
  padding: 0 var(--padding);
  box-sizing: border-box;
}
.title-input-config {
  flex: 1;
}
.value-input-config {
  width: 100px;
}
</style>
