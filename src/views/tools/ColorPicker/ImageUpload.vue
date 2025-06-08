<template>
  <div class="image-upload">
    <div 
      class="upload-area"
      :class="{ 'drag-over': isDragOver }"
      @drop="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
    >
      <div class="upload-content">
        <div class="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
        <h3 class="upload-title">Choose an image or drag it here</h3>
        <p class="upload-subtitle">PNG, JPG, GIF up to 10MB</p>
        <button class="btn btn-primary mt-4">Browse Files</button>
      </div>
    </div>
    
    <input 
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      style="display: none;"
    >
  </div>
</template>

<script>
export default {
  name: 'ImageUpload',
  data() {
    return {
      isDragOver: false
    }
  },
  methods: {
    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      const files = event.dataTransfer.files
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },

    handleDragOver(event) {
      event.preventDefault()
      this.isDragOver = true
    },

    handleDragLeave() {
      this.isDragOver = false
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.processFile(file)
      }
    },

    processFile(file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          this.$emit('image-loaded', img)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }
}
</script>

<style scoped>
.upload-area {
  border: 2px dashed var(--gray-300);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--gray-50);
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  color: var(--primary);
  margin-bottom: 16px;
}

.upload-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0 0 8px 0;
}

.upload-subtitle {
  color: var(--gray-500);
  margin: 0;
  font-size: 14px;
}
</style>