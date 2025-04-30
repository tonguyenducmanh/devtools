<template>
  <div class="container">
    <h1>💖 Base 64 to Image tool!</h1>
    <div class="input-container">
      <TDTextarea
        id="base64-input"
        placeHolder="Paste your Base64 string here"
        v-model="base64Result"
      ></TDTextarea>
      <TDButton id="convert-btn" @click="handleConvert"
        >Convert to Image</TDButton
      >
    </div>
    <div class="result-container">
      <img :src="srcImg" class="preview" ref="preview" />
      <TDButton id="download-btn" @click="handleDownloadImage"
        >Download Image</TDButton
      >
    </div>
  </div>
</template>
<script>
import _ from "@/common/TDUtility.js";

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.5rem;
}

/* Tab styles */
.tab-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #4caf50;
  background-color: transparent;
  color: #4caf50;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.tab-btn:hover {
  background-color: #e8f5e9;
}

.tab-btn.active {
  background-color: #4caf50;
  color: white;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
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
}

.drop-zone:hover {
  border-color: #4caf50;
  background-color: #f1f8f1;
}

.drop-zone p,
.input-container p {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

#preview,
#image-preview {
  max-width: 100%;
  margin-top: 1rem;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

#preview img,
#image-preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.result-container {
  margin-top: 1.5rem;
}

textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  resize: vertical;
  font-size: 0.9rem;
}

textarea:focus {
  outline: none;
  border: 2px solid #4caf50;
}

button {
  display: block;
  width: 100%;
  padding: 0.8rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

button:hover {
  background-color: #45a049;
  transform: scale(1.01);
}

button:active {
  transform: scale(0.98);
}

/* Base64 to Image specific styles */
.image-preview {
  min-height: 100px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f8f8;
  padding: 1rem;
}

.image-preview:empty::before {
  content: "Image preview will appear here";
  color: #666;
  font-size: 0.9rem;
}

/* Responsive design */
@media screen and (min-width: 768px) {
  .container {
    padding: 3rem;
  }

  h1 {
    font-size: 2rem;
  }
}

@media screen and (min-width: 1024px) {
  .container {
    padding: 4rem;
    max-width: 1200px;
  }
}
</style>
