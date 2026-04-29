<template>
  <div class="flex flex-col td-bilingual-web">
    <div class="flex td-tool-header">
      <TDInput
        v-model="url"
        :placeHolder="$t('i18nCommon.bilingualWeb.urlPlaceholder')"
        :noMargin="true"
      ></TDInput>
      <TDButton
        @click="fetchAndTranslate"
        :label="$t('i18nCommon.bilingualWeb.fetchButton')"
        :isLoading="isLoading"
        :noMargin="true"
      ></TDButton>
    </div>

    <div class="td-bilingual-content">
      <div v-if="isLoading" class="td-loading-overlay">
        <div class="loader"></div>
        <div class="loading-text">
          {{ $t("i18nCommon.bilingualWeb.fetching") }}
        </div>
      </div>
      <iframe
        v-else-if="resultHtml"
        ref="bilingualIframe"
        class="td-bilingual-result"
        :srcdoc="resultHtml"
        @load="onIframeLoad"
        frameborder="0"
      ></iframe>
      <div v-else class="td-empty-result">
        {{ $t("i18nCommon.bilingualWeb.resultPlaceholder") }}
      </div>
    </div>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDBilingualWebAPI from "@/common/api/request/AgentAPI/TDBilingualWebAPI.js";

export default {
  extends: TDToolBase,
  name: "TDBilingualWeb",
  data() {
    return {
      url: "",
      isLoading: false,
      resultHtml: "",
      agentAPI: null,
    };
  },
  watch: {
    url(newVal, oldVal) {
      if (newVal !== oldVal) {
        let domain = "";
        if (newVal) {
          try {
            let urlToParse = newVal;
            if (
              !urlToParse.startsWith("http://") &&
              !urlToParse.startsWith("https://")
            ) {
              urlToParse = "http://" + urlToParse;
            }
            domain = new URL(urlToParse).hostname;
          } catch (e) {
            domain = newVal.split("/")[0];
          }
        }
        this.reBuildTabTitle(domain);
      }
    },
  },
  mounted() {
    this.agentAPI = new TDBilingualWebAPI();
  },
  methods: {
    async fetchAndTranslate() {
      if (!this.url) {
        this.$tdToast.warning(
          this.$t("i18nCommon.bilingualWeb.urlPlaceholder"),
        );
        return;
      }

      this.isLoading = true;
      try {
        const response = await this.agentAPI.fetchBilingualWeb(this.url);
        if (response && response.success) {
          this.resultHtml = response.data.data;
          this.$tdToast.success(
            this.$t("i18nCommon.bilingualWeb.fetchSuccess"),
          );
        } else {
          this.$tdToast.error(this.$t("i18nCommon.bilingualWeb.fetchError"));
        }
      } catch (error) {
        console.error("Lỗi khi tải và dịch trang:", error);
        if (error.response && error.response.status === 404) {
          this.$tdUtility.showErrorNotFoundAgentServer();
        } else {
          this.$tdToast.error(this.$t("i18nCommon.bilingualWeb.fetchError"));
        }
      } finally {
        this.isLoading = false;
      }
    },
    async onIframeLoad() {
      const iframeDoc = this.$refs.bilingualIframe?.contentDocument;
      if (!iframeDoc) return;

      // Inject CSS
      const style = iframeDoc.createElement("style");
      style.textContent = `
        .bilingual-trans { display: block; font-weight: 500; color: #10b981; margin-top: 4px; font-size: 0.9em; opacity: 0.9; }
      `;
      if (iframeDoc.head) {
        iframeDoc.head.appendChild(style);
      }

      // Đợi trang chạy JS động xong (như DocFX, React)
      setTimeout(() => {
        this.translateDOM(iframeDoc);
      }, 1500);
    },
    async translateDOM(doc) {
      const blockTags = [
        "P",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "LI",
        "TH",
        "TD",
        "DT",
        "DD",
      ];
      let blocks = [];
      let texts = [];

      blockTags.forEach((tag) => {
        let elements = doc.getElementsByTagName(tag);
        for (let el of elements) {
          if (el.querySelector(".bilingual-trans")) continue;

          let text = el.innerText ? el.innerText.trim() : "";
          if (text.length > 2 && text.length < 1000) {
            blocks.push(el);
            texts.push(text);
          }
        }
      });

      const batchSize = 20;
      for (let i = 0; i < texts.length; i += batchSize) {
        let batchTexts = texts.slice(i, i + batchSize);
        let batchBlocks = blocks.slice(i, i + batchSize);

        try {
          const response = await this.agentAPI.translateTextBatch(
            batchTexts,
            "vi",
          );
          if (response && response.success) {
            let translations = response.data.data;
            if (translations && translations.length === batchBlocks.length) {
              for (let j = 0; j < batchBlocks.length; j++) {
                let transText = translations[j];
                if (transText && transText.trim() !== batchTexts[j].trim()) {
                  let transDiv = doc.createElement("div");
                  transDiv.className = "bilingual-trans";
                  transDiv.textContent = transText;
                  batchBlocks[j].appendChild(transDiv);
                }
              }
            }
          }
        } catch (e) {
          console.error("Lỗi khi dịch lô text:", e);
        }
      }
    },
  },
};
</script>

<style lang="scss">
/* No global styles needed for v-html anymore */
</style>

<style scoped lang="scss">
.td-bilingual-web {
  width: 100%;
  height: 100%;
  gap: var(--padding);

  .td-tool-header {
    width: 100%;
    gap: var(--padding);
    .td-input-container {
      flex: 1;
    }
  }

  .td-bilingual-content {
    width: 100%;
    flex: 1;
    position: relative;
    background-color: var(--bg-layer-color);
    border-radius: var(--border-radius);
    overflow: auto;
    padding: var(--padding);

    .td-loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.1);
      z-index: 10;
      gap: 10px;
    }

    .td-empty-result {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color-light);
      font-style: italic;
    }

    .td-bilingual-result {
      width: 100%;
      height: 100%;
      border: none;
      background-color: white; /* Default background for iframe */
    }
  }
}
</style>
