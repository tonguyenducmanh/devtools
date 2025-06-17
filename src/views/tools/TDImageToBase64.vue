<template>
  <div class="container">
    <div class="title">{{ $t("i18nCommon.imageToBase64.title") }}</div>
    <div class="flex flex-wrap paste-box">
      <div
        ref="drop-zone"
        class="drop-zone"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <p v-if="!srcImg">{{ $t("i18nCommon.imageToBase64.dropZone") }}</p>
        <img v-if="srcImg" :src="srcImg" class="preview" ref="preview" />
      </div>
      <div class="result-container">
        <TDTextarea
          ref="base64-output"
          :placeHolder="$t('i18nCommon.imageToBase64.placeHolder')"
          v-model="base64Result"
          :readOnly="true"
          height="400px"
          width="500px"
        ></TDTextarea>
      </div>
    </div>
    <div class="flex">
      <TDButton
        ref="copy-btn"
        @click="haddleCopyEvent"
        :label="$t('i18nCommon.imageToBase64.copyButton')"
      ></TDButton>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDImageToBase64",
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
    haddleCopyEvent() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.base64Result);
    },
    handlePasteEvent(e) {
      let me = this;
      e.preventDefault();
      const items = e.clipboardData.items;

      for (let item of items) {
        if (item.type.includes("image")) {
          const blob = item.getAsFile();
          me.handleImageToBase64(blob);
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
      const files = e.dataTransfer.files;
      if (files[0] && files[0].type.includes("image")) {
        me.handleImageToBase64(files[0]);
      }
    },
    handleImageToBase64(blob) {
      let me = this;
      me.srcImg = URL.createObjectURL(blob);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        me.base64Result = reader.result;
      };
      reader.readAsDataURL(blob);
    },
  },
  data() {
    return {
      base64Result: null,
      srcImg: null,
    };
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;

  box-shadow: none;
}
.paste-box {
  column-gap: 20px;
  padding: var(--padding);
}

.drop-zone {
  min-width: 500px;
  max-width: 500px;
  min-height: 400px;
  max-height: 400px;
  border: 1px dashed var(--bg-active-color);
  padding: 1.5rem;
  text-align: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-zone:hover {
  border-color: var(--focus-color);
  background-color: var(--bg-hover-color);
}

.drop-zone p {
  color: #666;
}

.preview {
  width: 500px;
  height: auto;
  padding: var(--padding);
}

.result-container {
  display: flex;
}
</style>
