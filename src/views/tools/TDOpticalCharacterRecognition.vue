<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex tool-ocr-header">
        <TDUpload
          :noMargin="true"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @selected="handleImageSelected"
          ref="uploadArea"
          class="upload-area"
          :labelEmpty="$t('i18nCommon.OpticalCharacterRecognition.dropZone')"
          :label="$t('i18nCommon.oneTimePassword.dropZone.label')"
          multiple
        ></TDUpload>
        <TDButton
          :noMargin="true"
          :readOnly="ocrResults.length === 0 || isProcessing"
          @click="processOCR"
          :label="$t('i18nCommon.OpticalCharacterRecognition.process')"
        ></TDButton>
        <TDButton
          v-if="ocrResults.length > 0"
          :noMargin="true"
          :type="$tdEnum.buttonType.secondary"
          @click="copyAllResults"
          :label="$t('i18nCommon.OpticalCharacterRecognition.copyAll')"
        ></TDButton>
      </div>
      <div v-if="isProcessing" class="ocr-progress">
        <progress :value="progress" max="100"></progress>
        <span
          >{{ $t("i18nCommon.OpticalCharacterRecognition.processing") }}
          {{ progress }}%</span
        >
      </div>
      <div class="ocr-results flex-one">
        <div v-if="ocrResults.length === 0" class="ocr-placeholder">
          <span>{{
            $t("i18nCommon.OpticalCharacterRecognition.placeholder")
          }}</span>
        </div>
        <div
          v-else
          v-for="(item, index) in ocrResults"
          :key="index"
          class="ocr-item"
        >
          <div class="ocr-image-section">
            <img
              :src="item.previewUrl"
              class="preview"
              @mouseenter="showMagnifier($event, item.previewUrl)"
              @mousemove="moveMagnifier"
              @mouseleave="hideMagnifier"
            />
          </div>
          <div class="ocr-text-section">
            <TDTextarea
              v-model="item.text"
              :placeHolder="
                $t('i18nCommon.OpticalCharacterRecognition.placeHolder')
              "
              :readOnly="true"
              height="200px"
            ></TDTextarea>
            <div class="ocr-item-actions">
              <span class="confidence" v-if="item.confidence">
                {{ $t("i18nCommon.OpticalCharacterRecognition.confidence") }}:
                {{ item.confidence }}%
              </span>
              <TDButton
                :noMargin="true"
                :type="$tdEnum.buttonType.secondary"
                @click="copyResult(item.text)"
                :label="$t('i18nCommon.OpticalCharacterRecognition.copyButton')"
              ></TDButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    <TDSubSidebar v-model="isShowSidebar">
      <template v-slot:main>
        <div class="flex flex-col td-sub-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-item">
              <span class="sidebar-label">{{
                $t("i18nCommon.OpticalCharacterRecognition.language")
              }}</span>
              <TDComboBox
                v-model="selectedLanguage"
                :options="languageOptions"
                :width="150"
                :noMargin="true"
              />
            </div>
            <div class="sidebar-item">
              <span class="sidebar-label">{{
                $t("i18nCommon.OpticalCharacterRecognition.psm")
              }}</span>
              <TDComboBox
                v-model="selectedPSM"
                :options="psmOptions"
                :width="150"
                :noMargin="true"
              />
            </div>
            <div class="sidebar-item">
              <TDCheckbox
                v-model="enablePreprocessing"
                :label="
                  $t('i18nCommon.OpticalCharacterRecognition.preprocessing')
                "
                :variant="$tdEnum.checkboxType.switch"
                :noMargin="true"
              ></TDCheckbox>
            </div>
          </div>
          <div class="sidebar-info">
            <span class="info-label"
              >{{ $t("i18nCommon.OpticalCharacterRecognition.library") }}:</span
            >
            <span class="info-value">Tesseract.js</span>
          </div>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import Tesseract from "tesseract.js";
import TDSubSidebar from "@/components/TDSubSidebar.vue";

export default {
  name: "TDOpticalCharacterRecognition",
  components: { TDSubSidebar },
  created() {
    let me = this;
    document.addEventListener("paste", me.handlePasteEvent);
  },
  beforeUnmount() {
    let me = this;
    document.removeEventListener("paste", me.handlePasteEvent);
    me.hideMagnifier();
  },
  mounted() {},
  methods: {
    showMagnifier(e, src) {
      let me = this;
      me.hideMagnifier();

      const el = document.createElement("div");
      el.className = "magnifier";
      el.style.position = "fixed";
      el.style.pointerEvents = "none";
      el.style.zIndex = "9999";
      el.style.display = "none";
      el.style.width = "500px";
      el.style.height = "500px";
      el.style.backgroundImage = `url(${src})`;
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundColor = "#fff";
      el.style.border = "2px solid var(--focus-color)";
      el.style.borderRadius = "4px";
      el.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";

      document.body.appendChild(el);
      me.magnifierEl = el;
      me.magnifierSrc = src;

      me.moveMagnifier(e);
      el.style.display = "block";
    },
    moveMagnifier(e) {
      let me = this;
      if (!me.magnifierEl) return;

      const el = me.magnifierEl;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const magSize = 500;
      const offset = 20;

      let left = e.clientX + offset;
      let top = e.clientY + offset;

      if (left + magSize > vw - 10) {
        left = e.clientX - magSize - offset;
        if (left < 10) left = 10;
      }
      if (top + magSize > vh - 10) {
        top = e.clientY - magSize - offset;
        if (top < 10) top = 10;
      }
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;

      const img = e.target;
      const rect = img.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const zoomLevelX = magSize / rect.width;
      const zoomLevelY = magSize / rect.height;
      const zoomLevel = Math.max(zoomLevelX, zoomLevelY);

      const bgWidth = rect.width * zoomLevel;
      const bgHeight = rect.height * zoomLevel;
      const posX = x * bgWidth - magSize / 2;
      const posY = y * bgHeight - magSize / 2;

      el.style.backgroundSize = `${bgWidth}px ${bgHeight}px`;
      el.style.backgroundPosition = `${-posX}px ${-posY}px`;
    },
    hideMagnifier() {
      let me = this;
      if (me.magnifierEl) {
        me.magnifierEl.remove();
        me.magnifierEl = null;
        me.magnifierSrc = null;
      }
    },
    copyResult(text) {
      let me = this;
      me.$tdUtility.copyToClipboard(text);
      me.$tdToast.success(me.$t("i18nCommon.toastMessage.copy"));
    },
    copyAllResults() {
      let me = this;
      const allText = me.ocrResults.map((item) => item.text).join("\n\n");
      me.$tdUtility.copyToClipboard(allText);
      me.$tdToast.success(me.$t("i18nCommon.toastMessage.copy"));
    },
    handleImageSelected(files) {
      let me = this;
      if (files && files.length > 0) {
        me.$refs.uploadArea.setFileSelected(files);
        me.previewImages(files);
      }
    },
    previewImages(files) {
      let me = this;
      me.ocrResults = [];
      Array.from(files).forEach((file) => {
        if (file.type.includes("image")) {
          const previewUrl = URL.createObjectURL(file);
          me.ocrResults.push({
            file: file,
            previewUrl: previewUrl,
            text: "",
            confidence: null,
          });
        }
      });
      if (me.ocrResults.length > 0) {
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      }
    },
    preprocessImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, "image/png");
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    },
    async processOCR() {
      let me = this;
      if (
        me.$refs.uploadArea &&
        typeof me.$refs.uploadArea.getFileSelected === "function"
      ) {
        const files = me.$refs.uploadArea.getFileSelected();
        if (!files || files.length === 0) return;

        me.isProcessing = true;
        me.progress = 0;

        let processedCount = 0;
        const totalFiles = files.length;

        for (let i = 0; i < me.ocrResults.length; i++) {
          const item = me.ocrResults[i];
          try {
            let imageSource = item.file;

            if (me.enablePreprocessing) {
              me.$tdToast.success(
                me.$t("i18nCommon.OpticalCharacterRecognition.preprocessing"),
              );
              imageSource = await me.preprocessImage(item.file);
            }

            const result = await Tesseract.recognize(
              imageSource,
              me.selectedLanguage,
              {
                logger: (m) => {
                  if (m.status === "recognizing text") {
                    const fileProgress = m.progress;
                    const overallProgress =
                      ((processedCount + fileProgress) / totalFiles) * 100;
                    me.progress = Math.round(overallProgress);
                  }
                },
                tessedit_pageseg_mode: me.selectedPSM,
              },
            );
            item.text = result.data.text;
            item.confidence = Math.round(result.data.confidence);
          } catch (error) {
            console.error("OCR Error:", error);
            item.text = "Error: " + error.message;
          }
          processedCount++;
          me.progress = Math.round((processedCount / totalFiles) * 100);
        }

        me.isProcessing = false;
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.converted"));
      }
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
            me.previewImages([blob]);
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
        file.type.includes("image"),
      );

      if (files.length) {
        if (
          me.$refs.uploadArea &&
          typeof me.$refs.uploadArea.setFileSelected === "function"
        ) {
          me.$refs.uploadArea.setFileSelected(files);
          me.previewImages(files);
        }
      }
    },
  },
  data() {
    return {
      ocrResults: [],
      selectedLanguage: "vie",
      selectedPSM: "PSM_AUTO_OSD",
      languageOptions: [
        {
          value: "vie",
          label: this.$t("i18nCommon.OpticalCharacterRecognition.lang.vie"),
        },
        {
          value: "eng",
          label: this.$t("i18nCommon.OpticalCharacterRecognition.lang.eng"),
        },
      ],
      psmOptions: [
        {
          value: "PSM_AUTO_OSD",
          label: this.$t(
            "i18nCommon.OpticalCharacterRecognition.psmOptions.autoOsd",
          ),
        },
        {
          value: "PSM_AUTO",
          label: this.$t(
            "i18nCommon.OpticalCharacterRecognition.psmOptions.auto",
          ),
        },
        {
          value: "PSM_SINGLE_BLOCK",
          label: this.$t(
            "i18nCommon.OpticalCharacterRecognition.psmOptions.singleBlock",
          ),
        },
        {
          value: "PSM_SINGLE_LINE",
          label: this.$t(
            "i18nCommon.OpticalCharacterRecognition.psmOptions.singleLine",
          ),
        },
        {
          value: "PSM_SPARSE_TEXT",
          label: this.$t(
            "i18nCommon.OpticalCharacterRecognition.psmOptions.sparseText",
          ),
        },
      ],
      isProcessing: false,
      progress: 0,
      isDragOver: false,
      enablePreprocessing: true,
      isShowSidebar: true,
      magnifierEl: null,
      magnifierSrc: null,
    };
  },
};
</script>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 100%;
  gap: var(--padding);
}
.main-tool {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.tool-ocr-header {
  width: 100%;
  gap: var(--padding);
  flex-wrap: wrap;
}
.upload-area {
  flex: 1;
  min-width: 200px;
}
.ocr-progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--padding);
}
.ocr-progress progress {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  appearance: none;
}
.ocr-progress progress::-webkit-progress-bar {
  background-color: var(--bg-layer-color);
  border-radius: 4px;
}
.ocr-progress progress::-webkit-progress-value {
  background-color: var(--focus-color);
  border-radius: 4px;
}
.ocr-results {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}
.ocr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: var(--text-secondary-color);
  font-size: var(--font-size-medium);
}
.ocr-item {
  display: flex;
  gap: var(--padding);
  padding: var(--padding);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
.ocr-image-section {
  width: 200px;
  min-width: 200px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.ocr-image-section .preview {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: var(--border-radius);
  cursor: zoom-in;
}
.ocr-text-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}
.ocr-item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.confidence {
  font-size: 12px;
  color: var(--text-secondary-color);
}
.td-sub-sidebar {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}
.sidebar-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--padding);
}
.sidebar-info {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-label {
  font-size: 12px;
  color: var(--text-secondary-color);
}
.info-value {
  font-size: 12px;
  font-weight: bold;
  color: var(--focus-color);
}
.sidebar-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sidebar-label {
  white-space: nowrap;
}
</style>
