<template>
  <div class="card color-info">
    <h3 class="color-info-title">Selected Color</h3>
    
    <div class="color-preview" :style="{ backgroundColor: color.hex }"></div>
    
    <div class="color-values">
      <div class="color-value" @click="copyToClipboard(color.hex)">
        <label>HEX</label>
        <span class="value">{{ color.hex }}</span>
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
    
    <transition name="fade">
      <div v-if="showCopyMessage" class="copy-message">
        Copied to clipboard!
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'ColorInfo',
  props: {
    color: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showCopyMessage: false
    }
  },
  computed: {
    rgbString() {
      const { r, g, b } = this.color.rgb
      return `rgb(${r}, ${g}, ${b})`
    },
    hslString() {
      const { h, s, l } = this.color.hsl
      return `hsl(${h}, ${s}%, ${l}%)`
    }
  },
  methods: {
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.showCopyMessage = true
        setTimeout(() => {
          this.showCopyMessage = false
        }, 2000)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }
}
</script>

<style scoped>
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
  font-family: 'Monaco', 'Consolas', monospace;
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
</style>