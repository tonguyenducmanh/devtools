<template>
  <div class="flex td-bilingual-container w-full h-full">
    <div
      class="flex flex-col flex-one overflow-hidden td-bilingual-main p-4 gap-4"
      :class="{ 'td-bilingual-web-full-screen': isFullTab }"
    >
      <div class="flex td-tool-header">
        <!-- Toolbar: dùng TDToolbar với config động -->
        <TDToolbar :groups="toolbarGroups" @action="onToolbarAction" />
        <TDInput
          v-model="url"
          :placeHolder="$t('i18nCommon.bilingualWeb.urlPlaceholder')"
          :noMargin="true"
        ></TDInput>
        <TDButton
          @click="fetchAndTranslate"
          iconClass="td-send-icon"
          v-tooltip="$t('i18nCommon.bilingualWeb.fetchButton')"
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
          <TDDynamicBackgroundEffect />
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
              <div class="td-setting-label">
                {{ $t("i18nCommon.bilingualWeb.bilingualTextColor") }}
              </div>
              <TDColorPicker
                class="td-setting-color"
                :noMargin="true"
                v-model="currentConfigLayout.bilingualTextColor"
                @change="updateConfigLayout"
              ></TDColorPicker>
            </div>
            <div class="setting-item">
              <div class="td-setting-label">
                {{ $t("i18nCommon.bilingualWeb.delayTime") }}
              </div>
              <TDInput
                :noMargin="true"
                v-model="currentConfigLayout.delayTime"
                type="number"
                @change="updateConfigLayout"
              />
            </div>
            <div class="setting-item">
              <div class="td-setting-label">
                {{ $t("i18nCommon.bilingualWeb.blockTags") }}
              </div>
              <TDInput
                :noMargin="true"
                v-model="currentConfigLayout.blockTagsStr"
                @change="updateConfigLayout"
              />
            </div>
            <div class="setting-item">
              <div class="td-setting-label">
                {{ $t("i18nCommon.bilingualWeb.classFilters") }}
              </div>
              <TDInput
                :noMargin="true"
                placeHolder="VD: title;description"
                v-model="currentConfigLayout.classFiltersStr"
                @change="updateConfigLayout"
              />
            </div>
            <div class="setting-item">
              <div class="td-setting-label">
                {{ $t("i18nCommon.bilingualWeb.idFilters") }}
              </div>
              <TDInput
                :noMargin="true"
                placeHolder="VD: header;footer"
                v-model="currentConfigLayout.idFiltersStr"
                @change="updateConfigLayout"
              />
            </div>
          </div>
        </div>
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.History
          "
        >
          <TDHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            titleKey="url"
            :noMargin="true"
            :isAppendDuplicate="true"
            :cacheKey="$tdEnum.cacheConfig.BilingualWebHistory"
          />
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
import TDToolbar from "@/components/TDToolbar.vue";
import TDDynamicBackgroundEffect from "@/components/TDDynamicBackgroundEffect.vue";
import TDHistorySidebar from "@/components/TDHistorySidebar.vue";

export default {
  extends: TDToolBase,
  name: "TDBilingualWeb",
  components: {
    TDSubSidebar,
    TDSlideOption,
    TDBilingualWebHelp,
    TDToolbar,
    TDDynamicBackgroundEffect,
    TDHistorySidebar,
  },
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
      options.push({
        value: this.$tdEnum.ToolSidebarOption.History,
        label: this.$t("i18nCommon.history.title"),
        icon: "td-history-icon",
      });
      return options;
    },
    // ─── Toolbar groups config ─────────────────────────────────────
    toolbarGroups() {
      return [
        // Group: Undo / Redo
        {
          key: "history",
          items: [
            {
              key: "undo",
              icon: "td-undo-icon",
              tooltip: this.$t("i18nCommon.bilingualWeb.undo"),
              action: () => this.handleUndoLink(),
              class: this.historyPointer <= 0 ? "td-toolbar-btn-disabled" : "",
            },
            {
              key: "redo",
              icon: "td-redo-icon",
              tooltip: this.$t("i18nCommon.bilingualWeb.redo"),
              action: () => this.handleRedoLink(),
              class:
                this.historyPointer >= this.sessionHistory.length - 1
                  ? "td-toolbar-btn-disabled"
                  : "",
            },
          ],
        },
        // Group: utility
        {
          key: "utility",
          items: [
            {
              key: "fullscreen",
              icon: "td-full-screen-icon",
              tooltip: this.$t("i18nCommon.bilingualWeb.fullScreen"),
              action: () => this.handleFullScreen(),
            },
          ],
        },
      ];
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.BilingualWebConfigLayout,
      isFullTab: false,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.ToolSidebarOption.Setting,
        delayTime: 1500,
        blockTagsStr: "P;H1;H2;H3;H4;H5;H6;LI;TH;TD;DT;DD",
        classFiltersStr: "",
        idFiltersStr: "",
        bilingualTextColor: "#000000",
      },
      url: "",
      isLoading: false,
      resultHtml: "",
      agentAPI: null,
      sessionHistory: [],
      historyPointer: -1,
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
    // Khởi tạo stack nếu đã có url mặc định
    if (this.url) {
      this.sessionHistory = [this.url];
      this.historyPointer = 0;
    }
  },
  methods: {
    onToolbarAction({ key, option }) {
      const actionMap = {
        undoLink: () => this.handleUndoLink(),
        redoLink: () => this.handleRedoLink(),
        fullScreen: () => this.handleFullScreen(),
      };
      actionMap[key]?.();
    },
    handleUndoLink() {
      if (!this.isLoading && this.historyPointer > 0) {
        this.historyPointer--;
        this.url = this.sessionHistory[this.historyPointer];
        this.fetchAndTranslate(true);
      }
    },
    handleRedoLink() {
      if (
        !this.isLoading &&
        this.sessionHistory.length > 0 &&
        this.historyPointer < this.sessionHistory.length - 1
      ) {
        this.historyPointer++;
        this.url = this.sessionHistory[this.historyPointer];
        this.fetchAndTranslate(true);
      }
    },
    handleApplyHistory(url) {
      if (this.isLoading) return;
      this.url = url;
      // Tìm vị trí của URL trong session history
      const existingIndex = this.sessionHistory.lastIndexOf(url);
      if (existingIndex !== -1) {
        // Nếu đã có trong stack, nhảy tới index đó và coi như điều hướng lịch sử
        this.historyPointer = existingIndex;
        this.fetchAndTranslate(true);
      } else {
        // Nếu chưa có, coi như navigation mới
        this.fetchAndTranslate();
      }
    },
    handleFullScreen() {
      let me = this;
      me.isFullTab = !me.isFullTab;
    },
    async fetchAndTranslate(isHistoryNav = false) {
      // Đảm bảo isHistoryNav là boolean (tránh nhận PointerEvent từ @click)
      if (typeof isHistoryNav !== "boolean") {
        isHistoryNav = false;
      }
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
          let html = response.data.data;

          const injectedBaseUrl = this.url ? this.url.replace(/"/g, '\\"') : "";
          const injectHTML =
            `
          <script>
		// Patch Worker to prevent cross-origin SecurityError from crashing dynamic sites
		const OriginalWorker = window.Worker;
		if (OriginalWorker) {
			window.Worker = function(scriptURL, options) {
				try {
					return new OriginalWorker(scriptURL, options);
				} catch (e) {
					console.warn("Intercepted Worker cross-origin error:", e);
					return {
						postMessage: function() {},
						terminate: function() {},
						addEventListener: function() {},
						removeEventListener: function() {}
					};
				}
			};
		}
		// Patch ServiceWorker just in case
		if (navigator.serviceWorker && navigator.serviceWorker.register) {
			const originalRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
			navigator.serviceWorker.register = function(url, options) {
				return originalRegister(url, options).catch(err => {
					console.warn("Intercepted ServiceWorker error:", err);
					return null;
				});
			};
		}
              (function() {
                const injectedBaseUrl = "${injectedBaseUrl}";
                const OriginalURL = window.URL;
                const originalWorker = window.Worker;

                // Fix URL constructor for about:srcdoc
                window.URL = function(url, base) {
                  let resolvedBase = base;
                  if (base === 'about:srcdoc' || base === window.location.href) {
                    resolvedBase = (document.baseURI && document.baseURI !== 'about:srcdoc') ? document.baseURI : injectedBaseUrl;
                  }
                  if (resolvedBase !== undefined) {
                    return new OriginalURL(url, resolvedBase);
                  } else {
                    try {
                      return new OriginalURL(url);
                    } catch (e) {
                      const baseFallback = (document.baseURI && document.baseURI !== 'about:srcdoc') ? document.baseURI : injectedBaseUrl;
                      return new OriginalURL(url, baseFallback);
                    }
                  }
                };
                Object.setPrototypeOf(window.URL, OriginalURL);
                window.URL.prototype = OriginalURL.prototype;
                window.URL.createObjectURL = OriginalURL.createObjectURL;
                window.URL.revokeObjectURL = OriginalURL.revokeObjectURL;

                // Fix Worker cross-origin
                window.Worker = function(url, options) {
                  try {
                    const urlStr = typeof url === 'string' ? url : (url && url.href) ? url.href : String(url);
                    const baseToUse = (document.baseURI && document.baseURI !== 'about:srcdoc') ? document.baseURI : injectedBaseUrl;
                    const absoluteUrl = new OriginalURL(urlStr, baseToUse).href;
                    const safeUrl = absoluteUrl.replace(/"/g, '\\"');
                    const isModule = options && options.type === 'module';

                    const preScript = "const workerBaseUrl = \\"" + safeUrl + "\\";\\n" +
                      "const OriginalURLWorker = self.URL;\\n" +
                      "self.URL = function(url, base) {\\n" +
                      "  let resBase = base;\\n" +
                      "  if (base === undefined || String(base).startsWith('blob:')) { resBase = workerBaseUrl; }\\n" +
                      "  if (resBase !== undefined) { return new OriginalURLWorker(url, resBase); }\\n" +
                      "  try { return new OriginalURLWorker(url); } catch(e) { return new OriginalURLWorker(url, workerBaseUrl); }\\n" +
                      "};\\n" +
                      "Object.setPrototypeOf(self.URL, OriginalURLWorker);\\n" +
                      "self.URL.prototype = OriginalURLWorker.prototype;\\n" +
                      "self.URL.createObjectURL = OriginalURLWorker.createObjectURL;\\n" +
                      "self.URL.revokeObjectURL = OriginalURLWorker.revokeObjectURL;\\n" +
                      "const originalFetch = self.fetch;\\n" +
                      "self.fetch = function(input, init) {\\n" +
                      "  try {\\n" +
                      "    const urlStr = typeof input === 'string' ? input : (input instanceof OriginalURLWorker ? input.href : (input ? input.url : String(input)));\\n" +
                      "    const resolvedUrl = new OriginalURLWorker(urlStr, workerBaseUrl).href;\\n" +
                      "    if (typeof input === 'string' || input instanceof OriginalURLWorker || input instanceof self.URL) { input = resolvedUrl; }\\n" +
                      "    else if (input instanceof Request) { input = new Request(resolvedUrl, input); }\\n" +
                      "  } catch(e) {}\\n" +
                      "  return originalFetch.call(self, input, init);\\n" +
                      "};\\n";

                    const scriptContent = isModule ? preScript + 'await import("' + safeUrl + '");' : preScript + 'importScripts("' + safeUrl + '");';
                    const blob = new Blob([scriptContent], { type: 'application/javascript' });
                    const blobUrl = OriginalURL.createObjectURL(blob);
                    return new originalWorker(blobUrl, options);
                  } catch (e) {
                    console.error('Worker injection failed:', e);
                    return new originalWorker(url, options);
                  }
                };
              })();
            </scr` +
            `ipt>
          `;

          if (html.includes("<head>")) {
            html = html.replace("<head>", "<head>" + injectHTML);
          } else if (html.match(/<head[^>]*>/i)) {
            html = html.replace(/(<head[^>]*>)/i, "$1" + injectHTML);
          } else {
            html = injectHTML + html;
          }

          this.resultHtml = html;

          // Lưu vào lịch sử persistent (IndexedDB)
          if (this.$refs.history) {
            this.$refs.history.saveToHistory(this.url);
          }

          // Quản lý session history cho undo/redo
          if (!isHistoryNav) {
            // Chỉ thêm vào stack nếu URL khác với URL hiện tại ở pointer
            if (
              this.historyPointer === -1 ||
              this.sessionHistory[this.historyPointer] !== this.url
            ) {
              // Nếu là navigation mới, xóa phần redo phía sau (giống Chrome)
              if (this.historyPointer < this.sessionHistory.length - 1) {
                this.sessionHistory = this.sessionHistory.slice(
                  0,
                  this.historyPointer + 1,
                );
              }
              // Thêm URL vào stack
              this.sessionHistory.push(this.url);
              this.historyPointer = this.sessionHistory.length - 1;
            }
          }

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
        .bilingual-trans { display: block; font-weight: 500; color: ${this.currentConfigLayout.bilingualTextColor}; margin-top: 4px; font-size: 0.9em; opacity: 0.9; }
      `;
      if (iframeDoc.head) {
        iframeDoc.head.appendChild(style);
      }

      // Xử lý sự kiện click vào các link
      iframeDoc.addEventListener("click", (e) => {
        const a = e.target.closest("a");
        if (a && a.href) {
          const hrefAttr = a.getAttribute("href");

          // Bỏ qua các link không trỏ đi đâu thực sự
          if (
            hrefAttr &&
            (hrefAttr.startsWith("#") || hrefAttr.startsWith("javascript:"))
          ) {
            // Nếu là anchor link, tự cuộn tới id
            if (hrefAttr.startsWith("#")) {
              e.preventDefault();
              const targetId = hrefAttr.substring(1);
              const targetEl = iframeDoc.getElementById(targetId);
              if (targetEl) targetEl.scrollIntoView();
            }
            return;
          }

          // Ngăn hành vi mở trang mới trong iframe
          e.preventDefault();
          // Cập nhật URL ở thẻ cha và load lại luồng translate
          this.url = a.href;
          this.fetchAndTranslate();
        }
      });

      setTimeout(
        () => {
          this.translateDOM(iframeDoc);
        },
        Number(this.currentConfigLayout.delayTime) || 1500,
      );
    },
    async translateDOM(doc) {
      const blockTags = (this.currentConfigLayout.blockTagsStr || "")
        .split(";")
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
      border-radius: var(--border-radius);

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
      }
      .td-bilingual-result {
        width: 100%;
        height: 100%;
        border: none;
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
        .td-setting-color {
          margin-top: var(--padding);
        }
      }
    }
  }
}
.td-bilingual-web-full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: var(--bg-main-color);
  padding: var(--padding);
}
</style>

<style lang="scss">
.td-toolbar-btn-disabled {
  opacity: 0.3 !important;
  pointer-events: none !important;
  cursor: default !important;
}
</style>
