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
          let input = [];
          if (!Array.isArray(source)) {
            input = [source];
          } else {
            input = source;
          }
          let config = {};
          config.tableName = me.tableName;
          config.schemaName = me.schemaName;
          config.primaryKeyField = me.primaryKeyField;
          config.enableDeleteScript = me.currentConfigLayout.enableDeleteScript;
          config.enableCreateTable = me.currentConfigLayout.enableCreateTable;
          me.outputSQL = me.buildScriptPostgreSQLScript(input, config);
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
    /**
     * build ra script insert dữ liệu
     * @param {array} source input cần build script
     */
    buildCreateTableScript(source, config) {
      let me = this;
      let createTableScript = "";
      if (source && Array.isArray(source) && config?.tableName) {
        let samples = source.slice(0, 3); // Take the first 3 samples
        let columns = Object.keys(samples[0]).map((key) => {
          let isPrimaryKey = key === config.primaryKeyField;
          let values = samples
            .map((record) => record[key])
            .filter((v) => v !== null);

          let dataType = "text"; // Default to text
          if (values.every((v) => typeof v === "number")) {
            dataType = values.every((v) => Number.isInteger(v))
              ? "integer"
              : "text";
          } else if (values.every((v) => typeof v === "boolean")) {
            dataType = "boolean";
          } else if (
            values.every(
              (v) =>
                typeof v === "string" &&
                /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                  v,
                ),
            )
          ) {
            dataType = "uuid";
          } else if (
            values.every(
              (v) =>
                typeof v === "string" &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v),
            )
          ) {
            dataType = "timestamp";
          }
          return `${key} ${dataType}${isPrimaryKey ? " not null" : " null"}`;
        });

        const primaryKeyConstraint = config.primaryKeyField
          ? `, primary key ("${config.primaryKeyField}")`
          : "";

        createTableScript = `create table if not exists ${
          config.tableName
        } (\n  ${columns.join(",\n  ")}${primaryKeyConstraint}\n)`;
      }
      return createTableScript;
    },
    buildScriptPostgreSQLScript(source, currenConfig) {
      let me = this;
      let script = "";
      let config = currenConfig;
      if (source && Array.isArray(source)) {
        let createTableScript = config.enableCreateTable
          ? me.buildCreateTableScript(source, config)
          : "";
        let deleteScript = config.enableDeleteScript
          ? me.buildDeleteAllScript(source, config)
          : null;
        let insertScripts = me.buildInsertAllScript(source, config);
        if (insertScripts && Array.isArray(insertScripts)) {
          let arrayScript = [];
          if (createTableScript) {
            arrayScript.push(createTableScript);
          }
          if (deleteScript) {
            arrayScript.push(deleteScript);
          }

          arrayScript = [...arrayScript, ...insertScripts];
          script = arrayScript.join(me.STRING_JOIN_BREAKLINE);
          if (script) {
            script += me.STRING_JOIN_BREAKLINE;
          }
        }
      }
      return script;
    },
    /**
     * build ra script insert toàn bộ các dòng có trong json soucr
     * @param {array} source input cần build script
     */
    buildInsertAllScript(source, config) {
      let me = this;
      let insertScripts = [];
      if (source && Array.isArray(source) && config?.tableName) {
        source.forEach((item) => {
          // lọc qua từng item mới build danh sách key, do có thể mỗi item trong mảng json có số lượng key khác nhau
          let allKeyFields = Object.keys(item);
          if (allKeyFields?.length > 0) {
            let insertFieldText = allKeyFields.join(me.STRING_JOIN);
            let insertValues = [];
            allKeyFields.forEach((key) => {
              if (key && item.hasOwnProperty(key)) {
                let valueInsert = item[key];
                if (valueInsert == null) {
                  insertValues.push(me.NULL_VALUE);
                } else if (me.checkIsText(valueInsert)) {
                  insertValues.push(me.getStringText(valueInsert));
                } else {
                  insertValues.push(valueInsert);
                }
              }
            });
            let insertValuesText = insertValues.join(me.STRING_JOIN);
            let insertScript = `insert into ${config.schemaName}.${config.tableName} (${insertFieldText}) values (${insertValuesText})`;
            insertScripts.push(insertScript);
          }
        });
      }
      return insertScripts;
    },
    /**
     * trả về text kèm ''
     * @param {string} text từ cần thêm ''
     * @returns text
     */
    getStringText(text) {
      return `'${text}'`;
    },
    /**
     * kiểm tra xem nội dung có phải text không
     * @param {*} input đoạn input cần kiểm tra
     * @returns
     */
    checkIsText(input) {
      return typeof input === "string" || input instanceof String;
    },
    /**
     * build ra script delete dữ liệu cũ trước khi insert
     * @param {array} source input cần build script
     */
    buildDeleteAllScript(source, config) {
      let me = this;
      let deleteScript = "";
      if (
        source &&
        Array.isArray(source) &&
        config &&
        config.primaryKeyField &&
        config.tableName
      ) {
        let allPrimaryValue = source.map((x) => x[config.primaryKeyField]);
        if (allPrimaryValue?.length > 0) {
          let tempPrimaryValue = allPrimaryValue[0];
          let arrayPrimaryDelete = "";
          if (me.checkIsText(tempPrimaryValue)) {
            arrayPrimaryDelete = allPrimaryValue
              .map((x) => me.getStringText(x))
              .join(me.STRING_JOIN);
          } else {
            arrayPrimaryDelete = allPrimaryValue.join(me.STRING_JOIN);
          }
          deleteScript = `delete from ${config.schemaName}.${config.tableName} where ${config.primaryKeyField} in (${arrayPrimaryDelete})`;
        }
      }
      return deleteScript;
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
      STRING_JOIN: ", ",
      STRING_JOIN_BREAKLINE: ";\n",
      NULL_VALUE: "null",
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
