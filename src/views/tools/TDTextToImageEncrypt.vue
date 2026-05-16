<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="flex flex-col input-section" :style="firstSectionResizeStyle">
        <div class="flex input-area">
          <TDTextarea
            :placeHolder="$t('i18nCommon.textToImageEncrypt.input.placeholder')"
            v-model="textInput"
          ></TDTextarea>
          <div class="flex flex-col button-generate">
            <TDButton
              :noMargin="true"
              :readOnly="!textInput"
              @click="generateImage(null)"
              iconClass="td-send-icon"
              v-tooltip="$t('i18nCommon.textToImageEncrypt.buttons.generate')"
            ></TDButton>
            <TDButton
              :noMargin="true"
              @click="downloadImage"
              :type="$tdEnum.buttonType.secondary"
              :readOnly="!imageSrc"
              iconClass="td-download-icon"
              v-tooltip="$t('i18nCommon.textToImageEncrypt.buttons.download')"
            ></TDButton>
            <TDButton
              :noMargin="true"
              @click="applyMock"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-example-icon"
              v-tooltip="$t('i18nCommon.textToImageEncrypt.buttons.example')"
            ></TDButton>
            <TDButton
              v-if="imageSrc"
              :noMargin="true"
              @click="toggleFullTab"
              :type="$tdEnum.buttonType.secondary"
              iconClass="td-full-screen-icon"
              v-tooltip="$t('i18nCommon.remoteDesktop.fullTab')"
            ></TDButton>
          </div>
        </div>
      </div>
      <TDResizer
        v-if="textInput && imageSrc"
        :direction="'vertical'"
        @resize="handleResize"
        :minSize="15"
      />
      <TDFullTabWrapper
        v-model="isFullTab"
        :hidePin="true"
        :style="!isFullTab ? secondSectionResizeStyle : {}"
        class="output-section"
        v-if="imageSrc"
      >
        <div
          class="image-preview"
          v-tooltip="$t('i18nCommon.copy')"
          @click="copyImage(imageSrc)"
        >
          <img :src="imageSrc" />
        </div>
      </TDFullTabWrapper>
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
          <TDTextToImageEncryptHelp />
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
            v-model="currentConfigLayout.isCompressText"
            :label="$t('i18nCommon.textToImageEncrypt.compressText')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <div class="flex flex-col input-config">
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToImageEncrypt.blockSize")
              }}</span>
              <TDInput
                v-model="currentConfigLayout.blockSize"
                :inputType="'number'"
                class="value-input-config"
                :placeHolder="'4'"
                :noMargin="true"
              />
            </div>
            <div class="flex input-config-item">
              <span class="title-input-config">{{
                $t("i18nCommon.textToQRCode.exampleWordCount")
              }}</span>
              <TDInput
                v-model="currentConfigLayout.exampleWordCount"
                :inputType="'number'"
                class="value-input-config"
                :placeHolder="'10'"
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
import TDCompress from "@/common/compress/TDCompress.js";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDMockTextGenerate from "@/common/mock/TDMockTextGenerate.js";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDFullTabWrapper from "@/components/TDFullTabWrapper.vue";
import TDTextToImageEncryptHelp from "@/views/helps/TDTextToImageEncryptHelp.vue";

export default {
  extends: TDToolBase,
  name: "TDTextToImageEncrypt",
  components: { TDSubSidebar, TDFullTabWrapper, TDTextToImageEncryptHelp },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.TextToImageEncryptConfigLayout,
      currentConfigLayout: {
        currentSidebarOption: this.$tdEnum.ToolSidebarOption.Setting,
        isShowSidebar: true,
        isCompressText: true,
        blockSize: 4,
        exampleWordCount: 10,
      },
      firstSectionSize: 30,
      secondSectionSize: 70,
      textInput: null,
      imageSrc: null,
      isFullTab: false,
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
    firstSectionResizeStyle() {
      return { height: `${this.firstSectionSize}%` };
    },
    secondSectionResizeStyle() {
      return { height: `${this.secondSectionSize}%` };
    },
  },
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
        textInput: TDMockTextGenerate.generateLoremWords(
          me.currentConfigLayout.exampleWordCount || 10,
        ),
      };
      this.$tdUtility.applyMock(this, dataMock);
    },
    async generateImage(input) {
      let me = this;
      let text = input ? input : me.textInput;
      if (!text) return;
      me.textInput = text;

      try {
        let dataBytes;
        if (me.currentConfigLayout.isCompressText) {
          let base64Compressed = await TDCompress.compressText(
            text,
            me.$tdEnum.compressType.gzip,
          );
          dataBytes = new Uint8Array(
            me.$tdUtility.base64ToArrayBuffer(base64Compressed),
          );
        } else {
          dataBytes = new TextEncoder().encode(text);
        }

        let blockSize = Number(me.currentConfigLayout.blockSize) || 4;
        let isCompress = me.currentConfigLayout.isCompressText ? 1 : 0;
        let dataLen = dataBytes.length;

        let totalPixels = 7 + dataLen;
        let gridWidth = Math.max(8, Math.ceil(Math.sqrt(totalPixels)));
        let gridHeight = Math.ceil(totalPixels / gridWidth);

        let canvas = document.createElement("canvas");
        canvas.width = gridWidth * blockSize;
        canvas.height = gridHeight * blockSize;
        let ctx = canvas.getContext("2d", { willReadFrequently: true });

        // Fill background with black
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let pixelArray = new Uint8Array(6 + dataLen);
        pixelArray[0] = 1; // Version
        pixelArray[1] = isCompress;
        pixelArray[2] = (dataLen >> 24) & 255;
        pixelArray[3] = (dataLen >> 16) & 255;
        pixelArray[4] = (dataLen >> 8) & 255;
        pixelArray[5] = dataLen & 255;
        pixelArray.set(dataBytes, 6);

        let drawPixel = (idx, r, g, b) => {
          let col = idx % gridWidth;
          let row = Math.floor(idx / gridWidth);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(col * blockSize, row * blockSize, blockSize, blockSize);
        };

        // Draw Signature Pixel at idx = 0 (Hot Pink)
        drawPixel(0, 255, 0, 128);

        for (let i = 0; i < pixelArray.length; i++) {
          let v = pixelArray[i];
          let r = (v >> 4) * 17;
          let g = (v & 15) * 17;
          let b = 255 - r;
          drawPixel(i + 1, r, g, b);
        }

        me.imageSrc = canvas.toDataURL("image/png");
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (err) {
        console.error(err);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    copyImage(dataUrl) {
      this.$tdUtility.copyImageFromUrl(dataUrl);
    },
    downloadImage() {
      if (!this.imageSrc) return;
      const arr = this.imageSrc.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      let blob = new Blob([u8arr], { type: mime });
      this.$tdUtility.createDownloadFileFromBlob(
        blob,
        "td-encrypted-image.png",
      );
    },
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
.input-area {
  width: 100%;
  height: 100%;
  flex: 1;
  gap: var(--padding);
}
.output-section {
  width: 100%;
  overflow: auto;
  align-items: flex-start;
  background: var(--bg-main-color);
}
.image-preview {
  padding: var(--padding);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated; /* To keep blocks sharp */
  }
}
.button-generate {
  justify-content: flex-start;
  height: 100%;
  gap: var(--padding);
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
</style>
