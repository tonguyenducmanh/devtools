<template>
  <div class="flex container">
    <div class="flex flex-col main-area">
      <div
        class="flex io-section"
        :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
      >
        <TMTextEditor
          isLabelTop
          :enableHighlight="true"
          language="json"
          :label="$t('i18nCommon.JSONToOneLineString.inputLabel')"
          :placeHolder="$t('i18nCommon.JSONToOneLineString.inputPlaceholder')"
          v-model="inputJSON"
          :wrapText="currentConfigLayout.wrapText"
        ></TMTextEditor>
        <TMTextEditor
          isLabelTop
          :label="$t('i18nCommon.JSONToOneLineString.outputLabel')"
          :readOnly="true"
          :enableHighlight="true"
          :language="outputHighlightLanguage"
          :placeHolder="$t('i18nCommon.JSONToOneLineString.outputPlaceholder')"
          v-model="outputString"
          :wrapText="currentConfigLayout.wrapText"
        ></TMTextEditor>
      </div>
      <div class="flex">
        <TMButton
          :label="$t('i18nCommon.JSONToOneLineString.convert')"
          @click="convertToOneLine"
        ></TMButton>
        <TMButton
          @click="handleCopyEvent"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.JSONToOneLineString.copy')"
        ></TMButton>
        <TMButton
          @click="applyMock"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.JSONToOneLineString.example')"
        ></TMButton>
      </div>
    </div>
    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Help
          "
        >
          <TMJSONToOneLineStringHelp />
        </div>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            titleKey="inputJSON"
            :noMargin="true"
            :cacheKey="$tmEnum.cacheConfig.JSONToOneLineStringHistory"
          />
        </div>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Setting
          "
        >
          <div class="flex flex-col group-section">
            <TMComboBox
              v-model="selectedLanguage"
              :options="languageOptions"
              :width="250"
              :noMargin="true"
              :isEditable="false"
              @selected="convertToOneLine"
            ></TMComboBox>
          </div>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.escapeUnicode"
            :label="$t('i18nCommon.JSONToOneLineString.escapeUnicode')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMJSONToOneLineStringHelp from "@/views/helps/TMJSONToOneLineStringHelp.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";

const LANGUAGE_MODE = {
  JavaScript: "javascript",
  CSharp: "csharp",
  Go: "go",
  Python: "python",
  Java: "java",
  Raw: "raw",
};
export default {
  extends: TMToolBase,
  name: "TMJSONToOneLineString",
  components: { TMSubSidebar, TMJSONToOneLineStringHelp, TMHistorySidebar },
  created() {},
  beforeUnmount() {},
  mounted() {},
  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Help,
        label: this.$t("i18nCommon.sidebarOption.help"),
        icon: "tm-help-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.History,
        label: this.$t("i18nCommon.history.title"),
        icon: "tm-history-icon",
      });
      return options;
    },
    languageOptions() {
      return [
        {
          label: this.$t("i18nCommon.JSONToOneLineString.lang.javascript"),
          value: LANGUAGE_MODE.JavaScript,
        },
        {
          label: this.$t("i18nCommon.JSONToOneLineString.lang.csharp"),
          value: LANGUAGE_MODE.CSharp,
        },
        {
          label: this.$t("i18nCommon.JSONToOneLineString.lang.go"),
          value: LANGUAGE_MODE.Go,
        },
        {
          label: this.$t("i18nCommon.JSONToOneLineString.lang.python"),
          value: LANGUAGE_MODE.Python,
        },
        {
          label: this.$t("i18nCommon.JSONToOneLineString.lang.java"),
          value: LANGUAGE_MODE.Java,
        },
        {
          label: this.$t("i18nCommon.JSONToOneLineString.lang.raw"),
          value: LANGUAGE_MODE.Raw,
        },
      ];
    },
    outputHighlightLanguage() {
      switch (this.selectedLanguage) {
        case LANGUAGE_MODE.JavaScript:
          return "javascript";
        case LANGUAGE_MODE.CSharp:
          return "csharp";
        case LANGUAGE_MODE.Go:
          return "go";
        case LANGUAGE_MODE.Python:
          return "python";
        case LANGUAGE_MODE.Java:
          return "java";
        default:
          return "plaintext";
      }
    },
  },
  methods: {
    async applyMock() {
      let me = this;
      me.inputJSON = JSON.stringify(
        {
          id: 1,
          name: "Nguyễn Văn A",
          email: "example@mail.com",
          roles: ["admin", "user"],
          address: {
            city: "Hà Nội",
            country: "Việt Nam",
          },
          isActive: true,
        },
        null,
        2,
      );
      me.convertToOneLine();
    },

    /**
     * Thử parse input theo nhiều cách: JSON strict -> JS object eval
     * @param {string} raw chuỗi input từ textarea
     * @returns object đã parse hoặc null nếu thất bại
     */
    tryParseInput(raw) {
      // Bước 1: thử JSON.parse chuẩn trước
      try {
        return JSON.parse(raw);
      } catch (_) {}

      // Bước 2: input là JS object thuần (key không có quotes, trailing comma,
      // single-quoted string, comment, undefined, v.v.)
      // Dùng Function constructor để eval an toàn trong scope rỗng
      try {
        // Bọc trong dấu () để tránh nhầm block statement
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${raw});`)();
        // Chỉ chấp nhận object/array, không chấp nhận primitive đơn thuần từ eval
        if (result !== null && typeof result === "object") {
          return result;
        }
        // Primitive cũng cho qua (số, boolean, string)
        return result;
      } catch (_) {}

      return undefined;
    },

    /**
     * Chuyển JSON / JS object thành 1 dòng string theo ngôn ngữ đã chọn
     */
    convertToOneLine() {
      let me = this;
      try {
        if (!me.inputJSON || !me.inputJSON.trim()) {
          me.outputString = "";
          return;
        }

        const parsed = me.tryParseInput(me.inputJSON.trim());

        if (parsed === undefined) {
          me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
          return;
        }

        // Stringify thành 1 dòng JSON chuẩn
        let oneLine = JSON.stringify(parsed);

        if (me.currentConfigLayout.escapeUnicode) {
          oneLine = me.escapeUnicodeChars(oneLine);
        }

        me.outputString = me.wrapByLanguage(oneLine, me.selectedLanguage);
        me.saveToHistory();
        me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Error in convertToOneLine:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /**
     * Bọc chuỗi JSON 1 dòng theo cú pháp ngôn ngữ lập trình
     * @param {string} jsonOneLine chuỗi JSON 1 dòng
     * @param {string} language ngôn ngữ lập trình đầu ra
     */
    wrapByLanguage(jsonOneLine, language) {
      // Escape dấu ngoặc kép và backslash bên trong chuỗi
      const escaped = jsonOneLine.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

      switch (language) {
        case LANGUAGE_MODE.JavaScript:
          return `const json = "${escaped}";`;

        case LANGUAGE_MODE.CSharp:
          return `string json = "${escaped}";`;

        case LANGUAGE_MODE.Go:
          return `json := \`${jsonOneLine}\``;

        case LANGUAGE_MODE.Python:
          // Python dùng raw string để tránh escape
          return `json = '${jsonOneLine.replace(/'/g, "\\'")}'`;

        case LANGUAGE_MODE.Java:
          return `String json = "${escaped}";`;

        case LANGUAGE_MODE.Raw:
        default:
          return jsonOneLine;
      }
    },

    /**
     * Escape các ký tự unicode (non-ASCII) thành \\uXXXX
     * @param {string} str chuỗi cần escape
     */
    escapeUnicodeChars(str) {
      return str.replace(/[^\x00-\x7F]/g, (char) => {
        return "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0");
      });
    },

    handleCopyEvent() {
      let me = this;
      me.$tmUtility.copyToClipboard(me.outputString);
    },
    /**
     * Lưu input JSON hiện tại vào lịch sử
     */
    async saveToHistory() {
      let me = this;
      if (me.$refs.history && me.inputJSON) {
        let historyItem = {
          inputJSON: me.inputJSON,
          selectedLanguage: me.selectedLanguage,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    /**
     * Áp dụng input từ lịch sử
     * @param {Object} item - Item lịch sử
     */
    handleApplyHistory(item) {
      let me = this;
      if (item && item.inputJSON) {
        me.inputJSON = item.inputJSON;
        if (item.selectedLanguage) {
          me.selectedLanguage = item.selectedLanguage;
        }
        me.convertToOneLine();
      }
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.JSONToOneLineStringConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        splitHorizontal: true,
        wrapText: true,
        escapeUnicode: false,
      },
      selectedLanguage: LANGUAGE_MODE.CSharp,
      inputJSON: null,
      outputString: null,
    };
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.io-section {
  flex: 1;
  gap: var(--padding);
  width: 100%;
}
.main-area {
  flex: 1;
  height: 100%;
}
.tm-sidebar-content {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}
.group-section {
  width: 100%;
  margin-top: var(--padding);
  gap: calc(var(--padding) / 2);
  margin-bottom: var(--padding);
}
.section-label {
  font-size: var(--font-size-small);
  color: var(--text-secondary-color);
  font-weight: 500;
}
</style>
