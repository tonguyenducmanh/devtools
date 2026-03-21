<template>
  <div class="flex td-base64-to-image">
    <div class="container">
      <div class="io-section">
        <div class="panel left-panel">
          <TDTextarea
            isLabelTop
            :label="$t('i18nCommon.base64ToImage.input')"
            :placeHolder="$t('i18nCommon.base64ToImage.placeHolder')"
            v-model="base64Result"
          ></TDTextarea>
        </div>
        <div class="panel right-panel">
          <label class="panel-label">{{
            $t("i18nCommon.base64ToImage.result")
          }}</label>
          <div class="preview-container">
            <img v-if="srcImg" :src="srcImg" class="preview" ref="preview" />
            <div v-else class="placeholder">
              {{ $t("i18nCommon.base64ToImage.result") }}
            </div>
          </div>
        </div>
      </div>
      <div class="tool-footer">
        <TDButton
          @click="handleConvert"
          :label="$t('i18nCommon.base64ToImage.convert')"
        ></TDButton>
        <TDButton
          :type="$tdEnum.buttonType.secondary"
          @click="handleDownloadImage"
          :label="$t('i18nCommon.base64ToImage.donwloadImage')"
        ></TDButton>
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.example')"
        ></TDButton>
      </div>
    </div>
    <TDSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <TDBase64ToImageHelp />
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDBase64ToImageHelp from "@/views/helps/TDBase64ToImageHelp.vue";
export default {
  extends: TDToolBase,
  name: "TDBase64ToImage",
  components: { TDSubSidebar, TDBase64ToImageHelp },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    async applyMock() {
      const { TDMockBase64ToImage } = await import(
        /* webpackChunkName: "mock-base64-to-image" */
        "@/common/mock/TDMockBase64ToImage.js"
      );
      this.$tdUtility.applyMock(this, TDMockBase64ToImage);
    },
    handleConvert() {
      let me = this;
      try {
        me.srcImg = me.base64Result;
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    handleDownloadImage() {
      let me = this;
      if (!me.base64Result) return;

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
      keyCacheLayout: this.$tdEnum.cacheConfig.Base64ToImageConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
      },
      base64Result: null,
      srcImg: null,
    };
  },
};
</script>

<style scoped>
.td-base64-to-image {
  width: 100%;
  height: 100%;
}
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  flex: 1;
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
  min-width: 0; /* prevent text/image overflow from expanding the panel */
  min-height: 0;
  overflow: hidden;
}

/* Left panel: textarea fills the panel completely */
.left-panel :deep(.td-textarea-wrapper),
.left-panel :deep(textarea) {
  height: 100%;
  resize: none;
}

/* Right panel */
.right-panel {
  gap: var(--padding);
}

.panel-label {
  flex-shrink: 0;
  font-size: var(--font-size, 14px);
  color: var(--td-text-color);
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
