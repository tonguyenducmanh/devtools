<template>
  <div class="flex flex-col container">
    <div class="flex tool-ocr-header">
      <TDComboBox
        v-model="selectedLanguage"
        :options="languageOptions"
        :width="150"
        :noMargin="true"
        :borderRadiusPosition="[
          $tdEnum.BorderRadiusPosition.TopLeft,
          $tdEnum.BorderRadiusPosition.BottomLeft,
        ]"
      />
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
        :borderRadiusPosition="[
          $tdEnum.BorderRadiusPosition.TopRight,
          $tdEnum.BorderRadiusPosition.BottomRight,
        ]"
      ></TDUpload>
      <TDButton
        :noMargin="true"
        :readOnly="!hasFiles || isProcessing"
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
          <img :src="item.previewUrl" class="preview" />
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
</template>

<script>
import Tesseract from "tesseract.js";

export default {
  name: "TDOpticalCharacterRecognition",
  created() {
    let me = this;
    document.addEventListener("paste", me.handlePasteEvent);
  },
  beforeUnmount() {
    let me = this;
    document.removeEventListener("paste", me.handlePasteEvent);
  },
  mounted() {},
  computed: {
    hasFiles() {
      let me = this;
      if (
        me.$refs.uploadArea &&
        typeof me.$refs.uploadArea.getFileSelected === "function"
      ) {
        const files = me.$refs.uploadArea.getFileSelected();
        return files && files.length > 0;
      }
      return false;
    },
  },
  methods: {
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
            const result = await Tesseract.recognize(
              item.file,
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
      isProcessing: false,
      progress: 0,
      isDragOver: false,
    };
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  gap: var(--padding);
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
</style>
