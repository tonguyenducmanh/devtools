<template>
  <!-- Icon-only mode: dùng TMButton trigger input file ẩn -->
  <div v-if="iconClass" class="tm-upload-icon-wrap">
    <TMButton
      :class="{ 'tm-upload-hide-border': hideBorder }"
      :iconClass="iconClass"
      :readOnly="readOnly"
      :type="$tmEnum.buttonType.secondary"
      @click="triggerFileInput"
      :noMargin="true"
    />
    <input
      ref="fileInput"
      type="file"
      class="tm-upload-input"
      :disabled="readOnly"
      @change="handleFileSelect"
      :multiple="multiple"
    />
  </div>

  <!-- Normal mode -->
  <div
    v-else
    class="tm-upload"
    :style="{
      'max-width': maxWidth,
      ...borderRadiusStyle,
    }"
    :class="{ 'tm-upload-read-only': readOnly, 'tm-upload-hide-border': hideBorder }"
  >
    <label
      class="flex tm-upload-button"
      :class="{ 'tm-upload-btn-read-only': readOnly }"
      :style="borderRadiusStyle"
    >
      <span class="flex">
        {{ label ? label.capitalize() : $t("i18nCommon.uploadFile") }}
      </span>
      <input
        type="file"
        class="tm-upload-input"
        :disabled="readOnly"
        @change="handleFileSelect"
        :multiple="multiple"
      />
    </label>
    <div class="flex tm-selected-group" v-if="isShowSelect">
      <template v-if="selectedFiles.length > 0">
        <span class="tm-selected-item">
          {{ getTitleFileSelected }}
        </span>
      </template>
      <span v-else-if="labelEmpty" class="tm-selected-item">{{
        labelEmpty
      }}</span>
    </div>
  </div>
</template>

<script>
import TMStylePremitiveMixin from "@/mixins/TMStylePremitiveMixin.js";
import TMButton from "@/components/TMButton.vue";

export default {
  name: "TMUpload",
  mixins: [TMStylePremitiveMixin],
  components: { TMButton },

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
    iconClass: {
      type: String,
      default: "",
    },
    /**
     * Bỏ nền và viền của component. Dùng khi đặt TMUpload trong toolbar hoặc
     * trên nền trong suốt, để không lạc lõng với các control xung quanh.
     */
    hideBorder: {
      type: Boolean,
      default: false,
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
        result = `${me.$t("i18nCommon.fileSelected")}: ${
          me.selectedFiles.length
        }`;
      }
      return result;
    },
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
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
    clearFileSelected() {
      let me = this;
      me.selectedFiles = [];
    },
  },
};
</script>

<style lang="scss" scoped>
/* ── Normal upload mode ───────────────────────────────────── */
.tm-upload {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  width: 100%;
  height: var(--base-component-height);
  border-radius: var(--border-radius);
  background-color: var(--bg-main-color);
  color: var(--text-primary-color);
  font-size: var(--font-size-medium);
}
.tm-upload:hover {
  border: 1px solid var(--focus-color);
}
.tm-upload-read-only {
  background-color: var(--bg-layer-color);
  color: var(--text-secondary-color);
  border: 1px solid var(--border-color);
}
.tm-upload-button {
  box-sizing: border-box;
  cursor: pointer;
  padding: calc(var(--padding-medium) - 1px);
  border-radius: var(--border-radius);
  background-color: var(--bg-layer-color);
}
.tm-upload-btn-read-only {
  cursor: unset;
}
.tm-upload-btn-read-only:hover {
  background-color: unset;
}
.tm-upload-input {
  display: none;
}
.tm-selected-group {
  flex: 1;
  flex-direction: column;
  align-items: start;
  overflow: auto;
  height: 100%;
  padding: var(--padding);
  .tm-selected-item {
    padding-left: var(--padding);
    width: 100%;
    white-space: nowrap;
  }
}

/* ── Icon-only mode ───────────────────────────────────────── */
.tm-upload-icon-wrap {
  display: contents;
}

/* Bỏ nền và viền, bật bằng prop hideBorder */
.tm-upload-hide-border {
  border: none;
  background: transparent;
}

/* Chế độ icon-only: nút lấp hết ô cho khớp nút trong toolbar, và kế thừa màu
   chữ từ toolbar-btn. TMButton tự đặt color để tương phản với nền
   --btn-primary-bg; bỏ nền đi thì phải bỏ luôn color, nếu không icon sẽ sai
   màu và biến mất khi hover.
   Selector 2 class để đè được .tm-button của TMButton. */
.tm-upload-icon-wrap .tm-upload-hide-border {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  &:hover {
    border: none;
    background: transparent;
    color: inherit;
  }
}
</style>
