<template>
  <div class="flex flex-col container">
    <div class="title">{{ $t("i18nCommon.htmlPreview.title") }}</div>
    <div class="flex history-wrapper">
      <TDHistory
        ref="history"
        class="history-container"
        titleKey="inputHtml"
        :applyFunction="handlePreviewFromHistory"
        :cacheKey="$tdEnum.cacheConfig.HTMLPreviewHistory"
      ></TDHistory>
    </div>
    <div class="flex input-container">
      <TDTextarea
        :placeHolder="$t('i18nCommon.htmlPreview.inputHTML')"
        v-model="inputHtml"
        height="100%"
        :width="isFullscreenPreview ? '100%' : '50%'"
      ></TDTextarea>
      <iframe 
        v-if="!isFullscreenPreview"
        ref="previewFrame"
        class="preview-frame"
        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation allow-downloads allow-pointer-lock allow-presentation"
        :srcdoc="outputHtml"
      ></iframe>
    </div>
    <div class="preview-popup" v-if="isFullscreenPreview && outputHtml && isShowPopupPreview">
      <div class="popup-overlay">
        <div class="popup-header">
          <span>HTML Preview</span>
          <TDButton
            @click="closePopup"
            :type="$tdEnum.buttonType.secondary"
            :label="'×'"
          ></TDButton>
        </div>
        <iframe
          ref="popupFrame" 
          class="popup-frame"
          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation allow-downloads allow-pointer-lock allow-presentation"
          :srcdoc="outputHtml"
        ></iframe>
      </div>
    </div>
    <div class="flex button-container">
      <div class="flex">
        <TDButton
          @click="handlePreview"
          :label="$t('i18nCommon.htmlPreview.preview')"
        ></TDButton>
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.example')"
        ></TDButton>
        <TDButton
          @click="handleCopyEvent(inputHtml)"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.htmlPreview.copyHtml')"
        ></TDButton>
      </div>
      <div class="flex">
        <TDCheckbox
          v-model="isFullscreenPreview"
          :label="$t('i18nCommon.htmlPreview.fullscreenPreview')"
        ></TDCheckbox>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "TDHTMLPreview",
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    async applyMock() {
      try {
        // Lazy-load module HTML Preview Mock
        const { TDMockHTMLPreview } = await import(
          /* webpackChunkName: "mock-html-preview" */
          "@/common/mock/TDMockHTMLPreview.js"
        );
        this.$tdUtility.applyMock(this, TDMockHTMLPreview);
      } catch (error) {
        console.error("Load mock HTML preview failed:", error);
      }
    },
    async handlePreviewFromHistory(item) {
      let me = this;
      if (item && item.inputHtml) {
        me.inputHtml = item.inputHtml;
        await me.handlePreview();
      }
    },
    async handlePreview() {
      let me = this;
      try {
        if (me.inputHtml) {
          me.outputHtml = me.inputHtml;
          me.isShowPopupPreview = me.isFullscreenPreview;
          let historyItem = {
            inputHtml: me.inputHtml
          };
          await me.$refs.history.saveToHistory(historyItem);
          me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
        }
      } catch (error) {
        console.error("Error previewing HTML:", error);
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
    handleCopyEvent(value) {
      let me = this;
      me.$tdUtility.copyToClipboard(value);
    },
    closePopup() {
      // Only toggle off the popup visibility
      this.isShowPopupPreview = false;
    },
  },
  data() {
    return {
      inputHtml: null,
      outputHtml: null,
      isFullscreenPreview: false,
      isShowPopupPreview: false
    };
  },
};
</script>
<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.input-container {
  flex: 1;
  column-gap: var(--padding);
  width: 95%;
}
.history-wrapper {
  width: 95%;
}
.history-container {
  width: 100%;
}
.preview-frame {
  width: 50%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
.button-container {
  justify-content: space-between;
  align-items: center;
  margin-top: var(--padding);
}
.preview-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}
.popup-overlay {
  background: var(--bg-color);
  width: 90%;
  height: 90%;
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.popup-header {
  padding: var(--padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}
.popup-frame {
  flex: 1;
  width: 100%;
  border: none;
}
</style>
