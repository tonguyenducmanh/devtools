<template>
  <div class="title">Color picker tool!</div>
  <div class="td-color-picker">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Image Upload Section -->
      <div class="lg:col-span-2">
        <div class="card">
          <TDUpload
            v-if="!imageLoaded"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            @selected="processFile"
            ref="uploadArea"
            class="upload-area"
            maxHeight="200px"
            labelEmpty="Choose an image or drag it here, PNG, JPG, GIF up to 10MB"
            :label="'Upload'"
          ></TDUpload>
          <div v-else class="image-container">
            <div class="image-wrapper" ref="imageWrapper">
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

            <div class="image-controls mt-4">
              <TDButton
                @click="resetImage"
                label="Upload New Image"
                class="btn btn-secondary"
              >
              </TDButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Color Info and Palette Section -->
      <div class="color-info-section">
        <div v-if="selectedColor" class="mb-6">
          <div class="card color-info">
            <h3 class="color-info-title">Selected Color</h3>

            <div
              class="color-preview"
              :style="{ backgroundColor: selectedColor.hex }"
            ></div>

            <div class="color-values">
              <div
                class="color-value"
                @click="copyToClipboard(selectedColor.hex)"
              >
                <label>HEX</label>
                <span class="value">{{ selectedColor.hex }}</span>
                <button class="copy-btn">📋</button>
              </div>

              <div class="color-value" @click="copyToClipboard(rgbString)">
                <label>RGB</label>
                <span class="value">{{ rgbString }}</span>
                <button class="copy-btn">📋</button>
              </div>

              <div class="color-value" @click="copyToClipboard(hslString)">
                <label>HSL</label>
                <span class="value">{{ hslString }}</span>
                <button class="copy-btn">📋</button>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="colorPalette && colorPalette.length > 0"
          class="card color-palette"
        >
          <h3 class="palette-title">Color Palette</h3>

          <div class="palette-grid">
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

          <p class="palette-info">
            {{ colorPalette.length }} dominant colors extracted
          </p>
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
.image-container {
  position: relative;
}

.image-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.main-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  cursor: crosshair;
  display: block;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.image-controls {
  display: flex;
  justify-content: center;
}

.color-info-section {
  display: flex;
  flex-direction: column;
}
.color-info-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0 0 16px 0;
}

.color-preview {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--gray-200);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-values {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--gray-50);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-value:hover {
  background: var(--gray-100);
}

.color-value label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.color-value .value {
  font-family: "Monaco", "Consolas", monospace;
  font-size: 14px;
  color: var(--gray-800);
  flex: 1;
  text-align: center;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.copy-btn:hover {
  opacity: 1;
}

.copy-message {
  text-align: center;
  padding: 8px;
  background: var(--success);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 8px;
}

.palette-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0 0 16px 0;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.palette-color {
  aspect-ratio: 1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid var(--gray-200);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.palette-color:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border-color: var(--primary);
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
  font-size: 10px;
  font-family: "Monaco", "Consolas", monospace;
  text-align: center;
  display: block;
}

.palette-info {
  font-size: 14px;
  color: var(--gray-500);
  text-align: center;
  margin: 0;
}

</style>
