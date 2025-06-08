<template>
  <div class="container">
    <div class="title">Color picker tool!</div>
    <div class="flex td-color-picker">
      <div v-if="!imageLoaded" class="upload-area-container">
        <TDUpload
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @selected="processFile"
          ref="uploadArea"
          class="upload-area"
          maxHeight="100vh"
          labelEmpty="Choose an image or drag it here, PNG, JPG, GIF up to 10MB"
          :label="'Upload'"
        ></TDUpload>
      </div>
      <div v-if="imageLoaded" class="flex color-picker-container">
        <div class="flex flex-col image-container">
          <div class="flex image-wrapper" ref="imageWrapper">
            <canvas
              ref="canvas"
              @mousemove="handleMouseMove"
              @mouseleave="hideMagnifier"
              @click="selectColor"
              class="main-canvas"
            ></canvas>
            <MagnifyingGlass
              v-if="showMagnifier"
              :x="magnifierX"
              :y="magnifierY"
              :canvas="canvas"
              :mouse-x="mouseX"
              :mouse-y="mouseY"
            />
          </div>
          <div
            v-if="colorPalette && colorPalette.length > 0"
            class="flex palette-info"
          >
            <div>Color Palette</div>

            <div class="flex palette-grid">
              <div
                v-for="(color, index) in colorPalette"
                :key="index"
                class="palette-color"
                :style="{ backgroundColor: color.hex }"
                @click="handleColorSelected(color)"
                :title="color.hex"
              >
                <div class="color-overlay">
                  <span class="color-hex">{{ color.hex }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col color-info-section">
          <div>Selected Color</div>
          <template v-if="selectedColor">
            <div>{{ selectedColor.hex }}</div>
            <div
              class="color-preview"
              :style="{ backgroundColor: selectedColor.hex }"
            ></div>
            <TDButton
              v-if="selectedColor"
              ref="copy-btn"
              @click="haddleCopyEvent(selectedColor.hex)"
              label="Copy color"
            ></TDButton>
          </template>
          <TDButton
            :type="$tdEnum.buttonType.secondary"
            @click="resetImage"
            label="Upload New Image"
            class="btn btn-secondary"
          >
          </TDButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MagnifyingGlass from "@/components/TDMagnifyingGlass.vue";
import {
  extractImageColors,
  rgbToHex,
  rgbToHsl,
} from "@/common/color/TDColorUtils.js";

export default {
  components: {
    MagnifyingGlass,
  },
  data() {
    return {
      imageLoaded: false,
      canvas: null,
      ctx: null,
      showMagnifier: false,
      magnifierX: 0,
      magnifierY: 0,
      mouseX: 0,
      mouseY: 0,
      selectedColor: null,
      colorPalette: [],
      imageData: null,
    };
  },
  computed: {
    rgbString() {
      const { r, g, b } = this.selectedColor.rgb;
      return `rgb(${r}, ${g}, ${b})`;
    },
    hslString() {
      const { h, s, l } = this.selectedColor.hsl;
      return `hsl(${h}, ${s}%, ${l}%)`;
    },
  },
  mounted() {},
  methods: {
    haddleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
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

      if (files && files.length > 0) {
        if (
          me.$refs.uploadArea &&
          typeof me.$refs.uploadArea.setFileSelected === "function"
        ) {
          let currentFile = [files[0]];
          me.$refs.uploadArea.setFileSelected(); // chỉ lưu 1 file
          me.processFile(currentFile);
        }
      }
    },
    processFile(files) {
      let me = this;
      let file = files[0];
      if (!file.type.startsWith("image/")) {
        console.error("Please select an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          me.handleImageLoaded(img);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    handleImageLoaded(image) {
      this.imageLoaded = true;
      this.$nextTick(() => {
        this.setupCanvas(image);
        this.generateColorPalette(image);
      });
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.showCopyMessage = true;
        setTimeout(() => {
          this.showCopyMessage = false;
        }, 2000);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    },
    setupCanvas(image) {
      this.canvas = this.$refs.canvas;
      this.ctx = this.canvas.getContext("2d");

      // Set canvas size
      const containerWidth = this.$refs.imageWrapper.clientWidth;
      const aspectRatio = image.height / image.width;

      this.canvas.width = Math.min(containerWidth, image.width);
      this.canvas.height = this.canvas.width * aspectRatio;

      // Draw image
      this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
      this.imageData = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    },

    handleMouseMove(event) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = event.clientX - rect.left;
      this.mouseY = event.clientY - rect.top;

      // Position magnifier
      this.magnifierX = event.clientX;
      this.magnifierY = event.clientY;

      this.showMagnifier = true;
    },

    hideMagnifier() {
      this.showMagnifier = false;
    },

    selectColor(event) {
      if (!this.imageData) return;

      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor(event.clientX - rect.left);
      const y = Math.floor(event.clientY - rect.top);

      const pixelIndex = (y * this.canvas.width + x) * 4;
      const r = this.imageData.data[pixelIndex];
      const g = this.imageData.data[pixelIndex + 1];
      const b = this.imageData.data[pixelIndex + 2];

      this.selectedColor = {
        rgb: { r, g, b },
        hex: rgbToHex(r, g, b),
        hsl: rgbToHsl(r, g, b),
      };
    },

    async generateColorPalette(image) {
      try {
        this.colorPalette = await extractImageColors(image, 7);
      } catch (error) {
        console.error("Error generating color palette:", error);
        this.colorPalette = [];
      }
    },

    handleColorSelected(color) {
      this.selectedColor = color;
    },

    resetImage() {
      this.imageLoaded = false;
      this.canvas = null;
      this.ctx = null;
      this.showMagnifier = false;
      this.selectedColor = null;
      this.colorPalette = [];
      this.imageData = null;
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
}
.td-color-picker {
  display: flex;
  width: 100%;
  height: 100%;
}
.upload-area-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.upload-area {
  width: 70%;
  height: 50%;
}
.color-picker-container {
  width: 100%;
  height: 100%;
}
.image-container {
  position: relative;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.main-canvas {
  width: 100%;
  height: auto;
  border-radius: 12px;
  cursor: crosshair;
  display: block;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.palette-info {
  height: 100px;
  width: 100%;
  position: relative;
  align-items: center;
}
.color-preview {
  width: 80px;
  height: 80px;
  border-radius: var(--border-radius);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}
.palette-grid {
  height: 100px;
  overflow: auto;
  column-gap: var(--padding);
  margin: var(--padding);
}

.palette-color {
  width: 80px;
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.palette-color:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-color: var(--border-color);
}

.color-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px;
  transform: translateY(100%);
  transition: transform 0.2s ease;
}
.palette-color:hover .color-overlay {
  transform: translateY(0);
}
.color-hex {
  font-size: 15px;
  text-align: center;
  display: block;
}
</style>
