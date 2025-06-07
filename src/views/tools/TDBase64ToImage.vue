<template>
  <div class="container">
    <div class="title">Base64 to Image tool!</div>
    <div class="flex flex-wrap paste-box">
      <div class="result-container">
        <TDTextarea
          ref="base64-output"
          placeHolder="Paste your Base64 string here"
          v-model="base64Result"
          height="400px"
          width="500px"
        ></TDTextarea>
      </div>
      <div
        ref="drop-zone"
        class="drop-zone"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <p v-if="!srcImg">Result convert</p>
        <img v-if="srcImg" :src="srcImg" class="preview" ref="preview" />
      </div>
    </div>
    <div class="flex">
      <TDButton @click="handleConvert" label="Convert to Image"></TDButton>
      <TDButton
        :type="$tdEnum.buttonType.secondary"
        @click="handleDownloadImage"
        label="Download Image"
      ></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        label="Example"
      ></TDButton>
    </div>
  </div>
</template>
<script>
import { TDMockBase64ToImage } from "@/common/mock/TDMockBase64ToImage.js";

export default {
  name: "TDBase64ToImage",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    applyMock() {
      let me = this;
      me.$tdUtility.applyMock(me, TDMockBase64ToImage);
    },
    handleConvert() {
      let me = this;
      try {
        me.srcImg = me.base64Result;
      } catch (error) {
        alert("Invalid Base64 string");
      }
    },
    handleDownloadImage() {
      let me = this;
      if (!me.base64Result) return;

      // Create temporary link
      let link = document.createElement("a");
      link.href = me.base64Result;
      link.download = "image." + me.getImageExtension(me.base64Result);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    getImageExtension(base64String) {
      let match = base64String.match(/^data:image\/(\w+);base64,/);
      return match ? match[1] : "png";
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
  min-height: 100vh;
  box-shadow: none;
}
.paste-box {
  column-gap: 20px;
  padding: var(--padding);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

.drop-zone {
  min-width: 500px;
  max-width: 500px;
  min-height: 400px;
  max-height: 400px;
  border: 2px dashed var(--bg-active-color);
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

.preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.result-container {
  display: flex;
}
</style>
