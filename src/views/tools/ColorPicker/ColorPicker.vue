<template>
  <div class="color-picker">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Image Upload Section -->
      <div class="lg:col-span-2">
        <div class="card">
          <ImageUpload 
            v-if="!imageLoaded"
            @image-loaded="handleImageLoaded"
          />
          
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
              <button @click="resetImage" class="btn btn-secondary">
                Upload New Image
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Color Info and Palette Section -->
      <div class="color-info-section">
        <ColorInfo 
          v-if="selectedColor"
          :color="selectedColor"
          class="mb-6"
        />
        
        <ColorPalette 
          v-if="colorPalette.length > 0"
          :colors="colorPalette"
          @color-selected="handleColorSelected"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ImageUpload from './ImageUpload.vue'
import MagnifyingGlass from './MagnifyingGlass.vue'
import ColorInfo from './ColorInfo.vue'
import ColorPalette from './ColorPalette.vue'
import { extractImageColors, rgbToHex, rgbToHsl } from '@/common/color/TDColorUtils.js'

export default {
  name: 'ColorPicker',
  components: {
    ImageUpload,
    MagnifyingGlass,
    ColorInfo,
    ColorPalette
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
      imageData: null
    }
  },
  methods: {
    handleImageLoaded(image) {
      this.imageLoaded = true
      this.$nextTick(() => {
        this.setupCanvas(image)
        this.generateColorPalette(image)
      })
    },

    setupCanvas(image) {
      this.canvas = this.$refs.canvas
      this.ctx = this.canvas.getContext('2d')
      
      // Set canvas size
      const containerWidth = this.$refs.imageWrapper.clientWidth
      const aspectRatio = image.height / image.width
      
      this.canvas.width = Math.min(containerWidth, image.width)
      this.canvas.height = this.canvas.width * aspectRatio
      
      // Draw image
      this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
      this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    },

    handleMouseMove(event) {
      const rect = this.canvas.getBoundingClientRect()
      this.mouseX = event.clientX - rect.left
      this.mouseY = event.clientY - rect.top
      
      // Position magnifier
      this.magnifierX = event.clientX
      this.magnifierY = event.clientY
      
      this.showMagnifier = true
    },

    hideMagnifier() {
      this.showMagnifier = false
    },

    selectColor(event) {
      if (!this.imageData) return
      
      const rect = this.canvas.getBoundingClientRect()
      const x = Math.floor(event.clientX - rect.left)
      const y = Math.floor(event.clientY - rect.top)
      
      const pixelIndex = (y * this.canvas.width + x) * 4
      const r = this.imageData.data[pixelIndex]
      const g = this.imageData.data[pixelIndex + 1]
      const b = this.imageData.data[pixelIndex + 2]
      
      this.selectedColor = {
        rgb: { r, g, b },
        hex: rgbToHex(r, g, b),
        hsl: rgbToHsl(r, g, b)
      }
    },

    async generateColorPalette(image) {
      try {
        this.colorPalette = await extractImageColors(image, 7)
      } catch (error) {
        console.error('Error generating color palette:', error)
        this.colorPalette = []
      }
    },

    handleColorSelected(color) {
      this.selectedColor = color
    },

    resetImage() {
      this.imageLoaded = false
      this.canvas = null
      this.ctx = null
      this.showMagnifier = false
      this.selectedColor = null
      this.colorPalette = []
      this.imageData = null
    }
  }
}
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
</style>