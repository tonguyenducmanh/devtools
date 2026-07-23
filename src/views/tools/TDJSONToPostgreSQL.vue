<template>
  <div class="flex container">
    <div class="flex flex-col main-area">
      <div
        class="flex io-section"
        :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
      >
        <template v-if="!currentConfigLayout.enableFileUpload">
          <TDTextEditor
            isLabelTop
            :enableHighlight="true"
            language="json"
            :label="$t('i18nCommon.jsonToPostgreSQL.inputLabel')"
            :placeHolder="$t('i18nCommon.jsonToPostgreSQL.inputPlaceholder')"
            v-model="inputJSON"
            :wrapText="currentConfigLayout.wrapText"
          ></TDTextEditor>
        </template>
        <template v-else>
          <div class="upload-container">
            <TDUpload
              :label="$t('i18nCommon.jsonToPostgreSQL.uploadLabel')"
              :accept="'.json'"
              @selected="handleFileUpload"
            />
          </div>
        </template>
        <TDTextEditor
          isLabelTop
          :label="$t('i18nCommon.jsonToPostgreSQL.outputLabel')"
          :readOnly="true"
          :enableHighlight="true"
          language="sql"
          :placeHolder="$t('i18nCommon.jsonToPostgreSQL.outputPlaceholder')"
          v-model="outputSQL"
          :wrapText="currentConfigLayout.wrapText"
        ></TDTextEditor>
      </div>
      <div class="flex">
        <TDButton
          v-if="!currentConfigLayout.enableFileUpload"
          :label="$t('i18nCommon.jsonToPostgreSQL.convert')"
          @click="convertToPostgresSQL"
        ></TDButton>
        <TDButton
          v-else
          :label="$t('i18nCommon.jsonToPostgreSQL.convert')"
          @click="convertToPostgresSQL"
          :disabled="!inputJSON"
        ></TDButton>
        <TDButton
          @click="haddleCopyEvent"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.copy')"
          :disabled="!outputSQL"
        ></TDButton>
        <TDButton
          @click="downloadSQLFile"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.downloadSQL')"
          :disabled="!outputSQL"
        ></TDButton>
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.example')"
        ></TDButton>
      </div>
    </div>
    <TDSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="td-sidebar-menu">
          <TDSlideOption
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
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.Help
          "
        >
          <TDJSONToPostgreSQLHelp />
        </div>
        <div
          class="flex flex-col td-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tdEnum.ToolSidebarOption.Setting
          "
        >
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableFileUpload"
            :label="$t('i18nCommon.jsonToPostgreSQL.useFileUpload')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableCreateTable"
            :label="$t('i18nCommon.jsonToPostgreSQL.createTable')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableDeleteScript"
            :label="$t('i18nCommon.jsonToPostgreSQL.deleteOld')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          ></TDCheckbox>
          <div class="flex flex-col group-info">
            <TDInput
              :placeHolder="$t('i18nCommon.jsonToPostgreSQL.schemaName')"
              type="text"
              v-model="schemaName"
            />
            <TDInput
              :placeHolder="$t('i18nCommon.jsonToPostgreSQL.tableName')"
              type="text"
              v-model="tableName"
            />
            <TDInput
              :placeHolder="$t('i18nCommon.jsonToPostgreSQL.primaryKey')"
              type="text"
              v-model="primaryKeyField"
            />
          </div>
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>
<script>
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDJSONToPostgreSQLHelp from "@/views/helps/TDJSONToPostgreSQLHelp.vue";
import {
  jsonToPostgreSQL,
  buildCreateTableScript,
  buildInsertAllScript,
  buildDeleteAllScript,
  checkIsText,
  getStringText,
} from "@/common/utils/TDJSONToPostgreSQLUtil.js";
export default {
  extends: TDToolBase,
  name: "TDJSONToPostgreSQL",
  components: { TDSubSidebar, TDJSONToPostgreSQLHelp },
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
      const { TDMockJSONToPostgreSQL } = await import(
        /* webpackChunkName: "mock-json-to-postgresql" */
        "@/common/mock/TDMockJSONToPostgreSQL.js"
      );
      this.$tdUtility.applyMock(this, TDMockJSONToPostgreSQL);
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
          me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
        }
      } catch (error) {
        console.error("Error in convertToPostgresSQL:", error);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    haddleCopyEvent() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.outputSQL);
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
              me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
            }
          };
          reader.readAsText(file);
        }
      } catch (error) {
        console.error("Error handling file upload:", error);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    downloadSQLFile() {
      let me = this;
      if (me.outputSQL) {
        const blob = new Blob([me.outputSQL], { type: "text/plain" });
        me.$tdUtility.createDownloadFileFromBlob(
          blob,
          `${me.tableName || "export"}.sql`,
        );
      }
    },
  },
  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.JSONToPostgreSQLConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.ToolSidebarOption.Help,
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
.td-sidebar-content {
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  overflow: auto;
}
.group-info {
  width: 100%;
}
</style>
