<template>
  <div class="flex td-html-preview-container">
    <div class="flex flex-col flex-one overflow-hidden main-content">
      <div class="flex input-container">
        <TDTextEditor
          :placeHolder="$t('i18nCommon.htmlPreview.inputHTML')"
          v-model="inputHtml"
          height="100%"
          :width="isFullscreenPreview ? '100%' : '50%'"
        ></TDTextEditor>
        <iframe
          v-if="!isFullscreenPreview"
          ref="previewFrame"
          class="preview-frame"
          sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation allow-downloads allow-pointer-lock allow-presentation"
          :srcdoc="outputHtml"
        ></iframe>
      </div>
      <div
        class="preview-popup"
        v-if="isFullscreenPreview && outputHtml && isShowPopupPreview"
      >
        <div class="popup-overlay">
          <div class="popup-content">
            <TDButton
              @click="closePopup"
              :type="$tdEnum.buttonType.secondary"
              :label="'✕'"
              class="close-button"
            ></TDButton>
            <iframe
              ref="popupFrame"
              class="popup-frame"
              sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation allow-downloads allow-pointer-lock allow-presentation"
              :srcdoc="outputHtml"
            ></iframe>
          </div>
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
    <TDSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <div class="flex flex-col td-sidebar-content">
          <TDHistorySidebar
            ref="history"
            :applyFunction="handlePreviewFromHistory"
            titleKey="inputHtml"
            :noMargin="true"
            :cacheKey="$tdEnum.cacheConfig.HTMLPreviewHistory"
          />
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>
<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDHistorySidebar from "@/components/TDHistorySidebar.vue";
export default {
  extends: TDToolBase,
  name: "TDHTMLPreview",
  components: { TDSubSidebar, TDHistorySidebar },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {
    let me = this;
  },
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
            inputHtml: me.inputHtml,
          };
          await me.$refs.history.saveToHistory(historyItem);
          if (!me.isFullscreenPreview) {
            me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
          }
        }
      } catch (error) {
        console.error("Error previewing HTML:", error);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
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
      keyCacheLayout: this.$tdEnum.cacheConfig.HTMLPreviewConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
      },
      inputHtml: null,
      outputHtml: null,
      isFullscreenPreview: true,
      isShowPopupPreview: false,
    };
  },
};
</script>
<style scoped>
.td-html-preview-container {
  width: 100%;
  height: 100%;
}
.flex-one {
  flex: 1;
}
.main-content {
  height: 100%;
  width: 100%;
  justify-content: flex-start;
}
.input-container {
  flex: 1;
  column-gap: var(--padding);
  width: 100%;
}
.td-sidebar-content {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
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
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.2s ease;
}
.popup-overlay {
  background: var(--bg-color);
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: scaleIn 0.2s ease;
}
.popup-content {
  position: relative;
  width: 100%;
  height: 100%;
}
.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  padding: 4px 8px;
}
.popup-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--bg-color);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
  }
  to {
    transform: scale(1);
  }
}
</style>
