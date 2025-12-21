<template>
  <div
    class="td-upload"
    :style="{
      'max-width': maxWidth,
      ...borderRadiusStyle,
    }"
    :class="{ 'td-upload-read-only': readOnly }"
  >
    <label
      class="td-upload-button"
      :class="{ 'td-upload-btn-read-only': readOnly }"
    >
      {{ label ? label.capitalize() : $t("i18nCommon.uploadFile") }}
      <input
        type="file"
        class="td-upload-input"
        :disabled="readOnly"
        @change="handleFileSelect"
        :multiple="multiple"
      />
    </label>
    <div class="flex td-selected-group" v-if="isShowSelect">
      <template v-if="selectedFiles.length > 0">
        <span class="td-selected-item">
          {{ getTitleFileSelected }}
        </span>
      </template>
      <span v-else-if="labelEmpty">{{ labelEmpty }}</span>
    </div>
  </div>
</template>

<script>
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";

export default {
  name: "TDUpload",
  mixins: [TDStylePremitiveMixin],

  props: {
    readOnly: {
      type: Boolean,
      default: false,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null,
    },
    labelEmpty: {
      type: String,
      default: null,
    },
    isShowSelect: {
      type: Boolean,
      default: true,
    },
    maxWidth: {
      type: String,
      default: "100%",
    },
  },
  data() {
    return {
      selectedFiles: [],
    };
  },
  computed: {
    getTitleFileSelected() {
      let me = this;
      let result = "";
      if (me.selectedFiles && me.selectedFiles.length > 0) {
        if (me.selectedFiles.length == 1) {
          result = `${me.selectedFiles[0].name} (${me.formatFileSize(me.selectedFiles[0].size)})`;
        } else {
          result = `${me.$t("i18nCommon.fileSelected")}: ${me.selectedFiles.length}`;
        }
      }
      return result;
    },
  },
  methods: {
    handleFileSelect(event) {
      let me = this;
      if (
        event &&
        event.target &&
        event.target.files &&
        event.target.files.length > 0
      ) {
        let uploadFiles = Array.from(event.target.files);
        me.selectedFiles = uploadFiles;
        me.$emit("selected", uploadFiles);
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    getFileSelected() {
      return this.selectedFiles;
    },
    setFileSelected(files) {
      let me = this;
      if (files) {
        if (Array.isArray(files)) {
          me.selectedFiles = files;
        } else {
          me.selectedFiles = [files];
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.td-upload {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius);
  background-color: var(--bg-main-color);
  color: var(--text-primary-color);
  font-size: var(--font-size-medium);
}
.td-upload:hover {
  border: 1px solid var(--focus-color);
}
.td-upload-read-only {
  background-color: var(--bg-layer-color);
  color: var(--text-secondary-color);
  border: 1px solid var(--border-color);
}
.td-upload-button {
  padding: var(--padding);
  cursor: pointer;
  border-radius: var(--border-radius);
  background-color: var(--bg-layer-color);
}

.td-upload-btn-read-only {
  cursor: unset;
}
.td-upload-btn-read-only:hover {
  background-color: unset;
}
.td-upload-input {
  display: none;
}

.td-selected-group {
  flex: 1;
  flex-direction: column;
  align-items: start;
  overflow: auto;
  height: 100%;
  padding: var(--padding);
  .td-selected-item {
    padding-left: var(--padding);
    width: 100%;
    white-space: nowrap;
  }
}
</style>
