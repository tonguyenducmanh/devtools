<template>
  <div class="flex tm-html-preview-container">
    <div class="flex flex-col flex-one overflow-hidden main-content">
      <div class="flex input-container">
        <TMTextEditor
          :placeHolder="$t('i18nCommon.htmlPreview.inputHTML')"
          v-model="inputHtml"
          height="100%"
          :width="isFullscreenPreview ? '100%' : '50%'"
        ></TMTextEditor>
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
            <TMButton
              @click="closePopup"
              :type="$tmEnum.buttonType.secondary"
              :label="'✕'"
              class="close-button"
            ></TMButton>
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
          <TMButton
            @click="handlePreview"
            :label="$t('i18nCommon.htmlPreview.preview')"
          ></TMButton>
          <TMButton
            @click="applyMock"
            :type="$tmEnum.buttonType.secondary"
            :label="$t('i18nCommon.example')"
          ></TMButton>
          <TMButton
            @click="handleCopyEvent(inputHtml)"
            :type="$tmEnum.buttonType.secondary"
            :label="$t('i18nCommon.htmlPreview.copyHtml')"
          ></TMButton>
        </div>
        <div class="flex">
          <TMCheckbox
            v-model="isFullscreenPreview"
            :label="$t('i18nCommon.htmlPreview.fullscreenPreview')"
          ></TMCheckbox>
        </div>
      </div>
    </div>
    <TMSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:main>
        <div class="flex flex-col tm-sidebar-content">
          <TMHistorySidebar
            ref="history"
            :applyFunction="handlePreviewFromHistory"
            titleKey="inputHtml"
            :noMargin="true"
            :cacheKey="$tmEnum.cacheConfig.HTMLPreviewHistory"
          />
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
export default {
  extends: TMToolBase,
  name: "TMHTMLPreview",
  components: { TMSubSidebar, TMHistorySidebar },
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
        const { TMMockHTMLPreview } = await import(
          /* webpackChunkName: "mock-html-preview" */
          "@/common/mock/TMMockHTMLPreview.js"
        );
        this.$tmUtility.applyMock(this, TMMockHTMLPreview);
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
            me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
          }
        }
      } catch (error) {
        console.error("Error previewing HTML:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    handleCopyEvent(value) {
      let me = this;
      me.$tmUtility.copyToClipboard(value);
    },
    closePopup() {
      // Only toggle off the popup visibility
      this.isShowPopupPreview = false;
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.HTMLPreviewConfigLayout,
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
.tm-html-preview-container {
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
.tm-sidebar-content {
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
