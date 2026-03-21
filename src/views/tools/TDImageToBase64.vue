<template>
  <div class="container">
    <div class="io-section">
      <div class="panel left-panel">
        <label class="panel-label">{{
          $t("i18nCommon.imageToBase64.input")
        }}</label>
        <div>
          <TDUpload
            @selected="processFile"
            ref="uploadArea"
            class="upload-area"
          ></TDUpload>
        </div>
        <div class="preview-container">
          <img v-if="srcImg" :src="srcImg" class="preview" />
          <div v-else class="placeholder">
            {{ $t("i18nCommon.imageToBase64.placeHolder") }}
          </div>
        </div>
      </div>
      <div class="panel right-panel">
        <TDTextarea
          isLabelTop
          :label="$t('i18nCommon.imageToBase64.output')"
          :placeHolder="$t('i18nCommon.imageToBase64.placeHolder')"
          v-model="base64Result"
          :readOnly="true"
        ></TDTextarea>
      </div>
    </div>
    <div class="tool-footer">
      <TDButton
        ref="copy-btn"
        @click="haddleCopyEvent"
        :label="$t('i18nCommon.imageToBase64.copyButton')"
      ></TDButton>
    </div>
  </div>
</template>

<script>
export default {
  name: "TDImageToBase64",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    haddleCopyEvent() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.base64Result);
    },
    processFile(files) {
      let me = this;
      let data = null;
      if (Array.isArray(files)) {
        data = files[0];
      } else {
        data = files;
      }
      me.handleImageToBase64(data);
    },
    handleImageToBase64(blob) {
      let me = this;
      me.srcImg = URL.createObjectURL(blob);

      const reader = new FileReader();
      reader.onloadend = () => {
        me.base64Result = reader.result;
      };
      reader.readAsDataURL(blob);
      me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
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

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ── Two-panel row ── */
.io-section {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0; /* critical: lets flex children shrink below content size */
  column-gap: var(--padding);
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  flex: 0 0 calc(50% - var(--padding) / 2);
  width: calc(50% - var(--padding) / 2);
  min-width: 0; /* prevent content from expanding beyond 50% */
  min-height: 0;
  overflow: hidden;
}

/* Left panel layout */
.left-panel {
  gap: var(--padding);
}

.panel-label {
  flex-shrink: 0;
  font-size: var(--font-size, 14px);
  color: var(--td-text-color);
}

.upload-area {
  flex-shrink: 0;
}

.preview-container {
  flex: 1;
  min-height: 0; /* critical: lets the container shrink and not overflow */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--td-background-color);
  border: 1px solid var(--td-border-color);
  border-radius: var(--border-radius);
  padding: var(--padding);
  overflow: hidden;
}

.preview {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.placeholder {
  color: var(--td-text-secondary-color);
  text-align: center;
  user-select: none;
}

/* Right panel: textarea fills the panel completely */
.right-panel {
  :deep(.td-textarea-wrapper),
  :deep(textarea) {
    height: 100%;
    resize: none;
  }
}

/* ── Footer buttons ── */
.tool-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: var(--padding);
  margin-top: var(--padding);
}
</style>
