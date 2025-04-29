<template>
  <div class="container flex flex-col">
    <h1>💖 Image To base 64 tool!</h1>
    <div class="flex paste-box">
      <div
        ref="drop-zone"
        class="drop-zone"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <p v-if="!srcImg">Paste image here (Ctrl+V) or drag & drop</p>
        <img :src="srcImg" class="preview" ref="preview" />
      </div>
      <div class="result-container">
        <TDTextarea
          ref="base64-output"
          placeHolder="Base64 output will appear here"
          v-model="base64Result"
          :readOnly="true"
          height="300px"
          width="300px"
        ></TDTextarea>
      </div>
    </div>
    <TDButton
      ref="copy-btn"
      @click="haddleCopyEvent"
      label="Copy Base64"
    ></TDButton>
  </div>
</template>

<script>
import _ from "@/common/TDUtility.js";

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
      navigator.clipboard.writeText(me.base64Result);
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
  min-height: 100vh;
  box-shadow: none;
}
.paste-box {
  column-gap: 20px;
  padding: var(--padding);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

.drop-zone {
  min-width: 300px;
  max-width: 300px;
  min-height: 300px;
  max-height: 300px;
  border: 2px dashed #ddd;
  padding: 1.5rem;
  text-align: center;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: #f8f8f8;
  cursor: pointer;
}

.drop-zone:hover {
  border-color: var(--focus-color);
  background-color: #f8f1f7;
}

.drop-zone p {
  color: #666;
  font-size: 0.9rem;
}

.preview {
  max-width: 100%;
  margin-top: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
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
