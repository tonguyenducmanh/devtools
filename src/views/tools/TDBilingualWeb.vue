<template>
  <div class="flex td-bilingual-container w-full h-full">
    <div
      class="flex flex-col flex-one overflow-hidden td-bilingual-main p-4 gap-4"
    >
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

    <TDSubSidebar
      ref="subSidebar"
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
            :showIcon="true"
            v-if="sidebarOptions && sidebarOptions.length > 0"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.Help
          "
        >
          <TDBilingualWebHelp />
        </div>
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.Setting
          "
        >
          <div class="flex flex-col td-sidebar-settings">
            <div class="setting-item">
              <div class="td-setting-label">{{ $t('i18nCommon.bilingualWeb.delayTime') }}</div>
              <TDInput
                :noMargin="true"
                v-model="currentConfigLayout.delayTime"
                type="number"
                @change="updateConfigLayout"
              />
            </div>
            <div class="setting-item">
              <div class="td-setting-label">{{ $t('i18nCommon.bilingualWeb.blockTags') }}</div>
              <TDInput
                :noMargin="true"
                v-model="currentConfigLayout.blockTagsStr"
                @change="updateConfigLayout"
              />
            </div>
            <div class="setting-item">
              <div class="td-setting-label">{{ $t('i18nCommon.bilingualWeb.classFilters') }}</div>
              <TDInput
                :noMargin="true"
                placeHolder="VD: title;description"
                v-model="currentConfigLayout.classFiltersStr"
                @change="updateConfigLayout"
              />
            </div>
            <div class="setting-item">
              <div class="td-setting-label">{{ $t('i18nCommon.bilingualWeb.idFilters') }}</div>
              <TDInput
                :noMargin="true"
                placeHolder="VD: header;footer"
                v-model="currentConfigLayout.idFiltersStr"
                @change="updateConfigLayout"
              />
            </div>
          </div>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDBilingualWebAPI from "@/common/api/request/AgentAPI/TDBilingualWebAPI.js";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDSlideOption from "@/components/TDSlideOption.vue";
import TDBilingualWebHelp from "@/views/helps/TDBilingualWebHelp.vue";

export default {
  extends: TDToolBase,
  name: "TDBilingualWeb",
  components: { TDSubSidebar, TDSlideOption, TDBilingualWebHelp },
  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tdEnum.ToolSidebarOption.Help,
        label: this.$t("i18nCommon.sidebarOption.help"),
        icon: "td-help-icon",
      });
      options.push({
        value: this.$tdEnum.ToolSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "td-setting-icon",
      });
      return options;
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.BilingualWebConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.ToolSidebarOption.Setting,
        delayTime: 1500,
        blockTagsStr: "P,H1,H2,H3,H4,H5,H6,LI,TH,TD,DT,DD",
        classFiltersStr: "",
        idFiltersStr: "",
      },
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

      setTimeout(
        () => {
          this.translateDOM(iframeDoc);
        },
        Number(this.currentConfigLayout.delayTime) || 1500,
      );
    },
    async translateDOM(doc) {
      const blockTags = (this.currentConfigLayout.blockTagsStr || "")
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter((t) => t);
      const customClasses = (this.currentConfigLayout.classFiltersStr || "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s);
      const customIds = (this.currentConfigLayout.idFiltersStr || "")
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s);

      let uniqueBlocks = new Set();
      let blocks = [];
      let texts = [];

      const processElement = (el) => {
        if (uniqueBlocks.has(el)) return;
        if (el.querySelector(".bilingual-trans")) return;

        let text = el.innerText ? el.innerText.trim() : "";
        if (text.length > 2 && text.length < 1000) {
          uniqueBlocks.add(el);
          blocks.push(el);
          texts.push(text);
        }
      };

      blockTags.forEach((tag) => {
        let elements = doc.getElementsByTagName(tag);
        for (let el of elements) {
          processElement(el);
        }
      });

      customClasses.forEach((cls) => {
        try {
          let elements = doc.getElementsByClassName(cls);
          for (let el of elements) {
            processElement(el);
          }
        } catch (e) {
          console.warn("Invalid class:", cls);
        }
      });

      customIds.forEach((id) => {
        try {
          let el = doc.getElementById(id);
          if (el) {
            processElement(el);
          }
        } catch (e) {
          console.warn("Invalid id:", id);
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
.td-bilingual-container {
  width: 100%;
  height: 100%;
  .td-bilingual-main {
    height: 100%;
    .td-tool-header {
      gap: var(--padding);
      width: 100%;
      .td-input-container {
        flex: 1;
      }
      margin-bottom: var(--padding);
    }
    .td-bilingual-content {
      width: 100%;
      flex: 1;
      position: relative;
      background-color: var(--bg-layer-color);
      border-radius: var(--border-radius);
      overflow: auto;

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
        background-color: white;
      }
    }
  }
  .td-sidebar-content {
    width: 100%;
    height: 100%;
    justify-content: flex-start;
    overflow: auto;
    .td-sidebar-settings {
      width: 100%;
      height: 100%;
      justify-content: flex-start;
      margin-top: var(--padding);
      gap: var(--padding);
      .setting-item {
        width: 100%;
        margin-top: var(--padding);
      }
    }
  }
}
</style>
