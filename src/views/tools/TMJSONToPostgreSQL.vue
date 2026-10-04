<template>
  <div class="flex container">
    <div class="flex flex-col main-area">
      <div
        class="flex io-section"
        :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
      >
        <template v-if="!currentConfigLayout.enableFileUpload">
          <TMTextEditor
            isLabelTop
            :enableHighlight="true"
            language="json"
            :label="$t('i18nCommon.jsonToPostgreSQL.inputLabel')"
            :placeHolder="$t('i18nCommon.jsonToPostgreSQL.inputPlaceholder')"
            v-model="inputJSON"
            :wrapText="currentConfigLayout.wrapText"
          ></TMTextEditor>
        </template>
        <template v-else>
          <div class="upload-container">
            <TMUpload
              :label="$t('i18nCommon.jsonToPostgreSQL.uploadLabel')"
              :accept="'.json'"
              @selected="handleFileUpload"
            />
          </div>
        </template>
        <TMTextEditor
          isLabelTop
          :label="$t('i18nCommon.jsonToPostgreSQL.outputLabel')"
          :readOnly="true"
          :enableHighlight="true"
          language="sql"
          :placeHolder="$t('i18nCommon.jsonToPostgreSQL.outputPlaceholder')"
          v-model="outputSQL"
          :wrapText="currentConfigLayout.wrapText"
        ></TMTextEditor>
      </div>
      <div class="flex">
        <TMButton
          v-if="!currentConfigLayout.enableFileUpload"
          :label="$t('i18nCommon.jsonToPostgreSQL.convert')"
          @click="convertToPostgresSQL"
        ></TMButton>
        <TMButton
          v-else
          :label="$t('i18nCommon.jsonToPostgreSQL.convert')"
          @click="convertToPostgresSQL"
          :disabled="!inputJSON"
        ></TMButton>
        <TMButton
          @click="haddleCopyEvent"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.copy')"
          :disabled="!outputSQL"
        ></TMButton>
        <TMButton
          @click="downloadSQLFile"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.downloadSQL')"
          :disabled="!outputSQL"
        ></TMButton>
        <TMButton
          @click="applyMock"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.example')"
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
          <TMJSONToPostgreSQLHelp />
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
            :cacheKey="$tmEnum.cacheConfig.JSONToPostgreSQLHistory"
          />
        </div>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Setting
          "
        >
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableFileUpload"
            :label="$t('i18nCommon.jsonToPostgreSQL.useFileUpload')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableCreateTable"
            :label="$t('i18nCommon.jsonToPostgreSQL.createTable')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableDeleteScript"
            :label="$t('i18nCommon.jsonToPostgreSQL.deleteOld')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          ></TMCheckbox>
          <div class="flex flex-col group-info">
            <TMInput
              :placeHolder="$t('i18nCommon.jsonToPostgreSQL.schemaName')"
              type="text"
              v-model="schemaName"
            />
            <TMInput
              :placeHolder="$t('i18nCommon.jsonToPostgreSQL.tableName')"
              type="text"
              v-model="tableName"
            />
            <TMInput
              :placeHolder="$t('i18nCommon.jsonToPostgreSQL.primaryKey')"
              type="text"
              v-model="primaryKeyField"
            />
          </div>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>
<script>
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMJSONToPostgreSQLHelp from "@/views/helps/TMJSONToPostgreSQLHelp.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import {
  jsonToPostgreSQL,
  buildCreateTableScript,
  buildInsertAllScript,
  buildDeleteAllScript,
  checkIsText,
  getStringText,
} from "@/common/utils/TMJSONToPostgreSQLUtil.js";
export default {
  extends: TMToolBase,
  name: "TMJSONToPostgreSQL",
  components: { TMSubSidebar, TMJSONToPostgreSQLHelp, TMHistorySidebar },
  watch: {
    tableName(oldVal, newVal) {
      if (oldVal != newVal) {
        this.reBuildTabTitle(this.tableName);
      }
    },
  },
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
  },
  created() {
    let me = this;
  },
  beforeUnmount() {
    let me = this;
  },
  mounted() {},
  methods: {
    async applyMock() {
      // Lazy-load module
      const { TMMockJSONToPostgreSQL } = await import(
        /* webpackChunkName: "mock-json-to-postgresql" */
        "@/common/mock/TMMockJSONToPostgreSQL.js"
      );
      this.$tmUtility.applyMock(this, TMMockJSONToPostgreSQL);
    },
    async convertToPostgresSQL() {
      let me = this;
      try {
        let source = JSON.parse(me.inputJSON);
        if (source) {
          let config = {};
          config.tableName = me.tableName;
          config.schemaName = me.schemaName;
          config.primaryKeyField = me.primaryKeyField;
          config.enableDeleteScript = me.currentConfigLayout.enableDeleteScript;
          config.enableCreateTable = me.currentConfigLayout.enableCreateTable;
          me.outputSQL = jsonToPostgreSQL(source, config);
          await me.saveToHistory();
          me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
        }
      } catch (error) {
        console.error("Error in convertToPostgresSQL:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    haddleCopyEvent() {
      let me = this;
      me.$tmUtility.copyToClipboard(me.outputSQL);
    },
    async handleFileUpload(files) {
      let me = this;
      try {
        if (files && files.length > 0) {
          const file = files[0];
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              me.inputJSON = e.target.result;
              await me.convertToPostgresSQL();
            } catch (error) {
              console.error("Error processing JSON file:", error);
              me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
            }
          };
          reader.readAsText(file);
        }
      } catch (error) {
        console.error("Error handling file upload:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    downloadSQLFile() {
      let me = this;
      if (me.outputSQL) {
        const blob = new Blob([me.outputSQL], { type: "text/plain" });
        me.$tmUtility.createDownloadFileFromBlob(
          blob,
          `${me.tableName || "export"}.sql`,
        );
      }
    },
    /**
     * Lưu input JSON và cấu hình hiện tại vào lịch sử
     */
    async saveToHistory() {
      let me = this;
      if (me.$refs.history && me.inputJSON) {
        let historyItem = {
          inputJSON: me.inputJSON,
          tableName: me.tableName,
          schemaName: me.schemaName,
          primaryKeyField: me.primaryKeyField,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    /**
     * Áp dụng input từ lịch sử
     * @param {Object} item - Item lịch sử
     */
    async handleApplyHistory(item) {
      let me = this;
      if (item && item.inputJSON) {
        me.inputJSON = item.inputJSON;
        me.tableName = item.tableName;
        me.schemaName = item.schemaName;
        me.primaryKeyField = item.primaryKeyField;
        await me.convertToPostgresSQL();
      }
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.JSONToPostgreSQLConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        splitHorizontal: true,
        wrapText: true,
        enableCreateTable: false,
        enableDeleteScript: true,
        enableFileUpload: false,
      },
      config: null,
      tableName: null,
      schemaName: null,
      primaryKeyField: null,
      inputJSON: null,
      outputSQL: null,
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
.upload-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  margin-right: var(--padding);
}
.mb-4 {
  margin-bottom: 1rem;
}
.main-area {
  flex: 1;
  height: 100%;
}
.tm-sidebar-content {
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  overflow: auto;
}
.group-info {
  width: 100%;
}
</style>
