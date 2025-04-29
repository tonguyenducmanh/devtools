<template>
  <div class="container">
    <h1>💖 Image To base 64 tool!</h1>
    <div
      ref="drop-zone"
      class="drop-zone"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <p>Paste image here (Ctrl+V) or drag & drop</p>
      <img v-if="srcImg" :src="srcImg" class="preview" ref="preview" />
    </div>
    <div class="result-container">
      <TDTextarea
        ref="base64-output"
        placeHolder="Base64 output will appear here"
        v-model="base64Result"
        :readOnly="true"
        height="200px"
        width="300px"
      ></TDTextarea>
      <TDButton
        ref="copy-btn"
        @click="haddleCopyEvent"
        label="Copy Base64"
      ></TDButton>
    </div>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 0;
  width: 100%;
  min-height: 100vh;
  box-shadow: none;
  overflow: auto;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

/* Common styles */
.drop-zone,
.input-container {
  border: 2px dashed #ddd;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: #f8f8f8;
}

.drop-zone {
  cursor: pointer;
  overflow: auto;
}

.drop-zone:hover {
  border-color: var(--focus-color);
  background-color: #f8f1f7;
}

.drop-zone p,
.input-container p {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.preview {
  max-width: 300px;
  margin-top: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.preview img {
  max-width: 300px;
  max-height: 300px;
  object-fit: contain;
}

.result-container {
  margin-top: 1.5rem;
  display: flex;
}
</style>
