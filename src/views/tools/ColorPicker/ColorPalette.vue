<template>
  <div class="card color-palette">
    <h3 class="palette-title">Color Palette</h3>
    
    <div class="palette-grid">
      <div 
        v-for="(color, index) in colors"
        :key="index"
        class="palette-color"
        :style="{ backgroundColor: color.hex }"
        @click="selectColor(color)"
        :title="color.hex"
      >
        <div class="color-overlay">
          <span class="color-hex">{{ color.hex }}</span>
        </div>
      </div>
    </div>
    
    <p class="palette-info">
      {{ colors.length }} dominant colors extracted
    </p>
  </div>
</template>

<script>
export default {
  name: 'ColorPalette',
  props: {
    colors: {
      type: Array,
      required: true
    }
  },
  methods: {
    selectColor(color) {
      this.$emit('color-selected', color)
    }
  }
}
</script>

<style scoped>
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
  font-family: 'Monaco', 'Consolas', monospace;
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