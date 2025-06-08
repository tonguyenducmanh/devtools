<template>
  <div class="flex flex-col container">
    <div class="title">JSON to PostgreSQL tool!</div>
    <div class="flex history-wrapper">
      <TDHistory
        ref="history"
        class="history-container"
        :applyFunction="convertToPostgresSQLFromHistory"
        :cacheKey="$tdEnum.cacheConfig.JSONToPostgreSQL"
      ></TDHistory>
    </div>
    <div class="flex flex-wrap metadata-inputs">
      <div>
        <TDInput label="Tên schema" type="text" v-model="schemaName" />
      </div>
      <div>
        <TDInput label="Tên bảng" type="text" v-model="tableName" />
      </div>
      <div>
        <TDInput label="Cột khóa chính" type="text" v-model="primaryKeyField" />
      </div>
    </div>

    <div class="flex io-section">
      <TDTextarea
        isLabelTop
        label="Nhập JSON"
        placeHolder="Nhập JSON ở đây..."
        v-model="inputJSON"
      ></TDTextarea>
      <TDTextarea
        isLabelTop
        label="Kết quả SQL"
        :readOnly="true"
        placeHolder="SQL sẽ xuất hiện ở đây..."
        v-model="outputSQL"
      ></TDTextarea>
    </div>
    <div class="flex">
      <TDCheckbox
        v-model="enableCreateTable"
        label="Thêm script tạo bảng"
      ></TDCheckbox>
      <TDCheckbox
        v-model="enableDeleteScript"
        label="Thêm script xóa dữ liệu cũ"
      ></TDCheckbox>
    </div>

    <div class="flex">
      <TDButton label="Chuyển đổi" @click="convertToPostgresSQL"></TDButton>
      <TDButton
        @click="haddleCopyEvent"
        :type="$tdEnum.buttonType.secondary"
        label="Copy"
      ></TDButton>
      <TDButton
        @click="applyMock"
        :type="$tdEnum.buttonType.secondary"
        label="Example"
      ></TDButton>
    </div>
  </div>
</template>
<script>
export default {
  name: "TDImageToBase64",
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

    async convertToPostgresSQLFromHistory(item) {
      let me = this;
      let historyItem = item ? JSON.parse(item) : null;
      if (historyItem && historyItem.inputJSON) {
        me.inputJSON = historyItem.inputJSON;
        me.tableName = historyItem.tableName;
        me.schemaName = historyItem.schemaName;
        me.primaryKeyField = historyItem.primaryKeyField;
        me.enableCreateTable = historyItem.enableCreateTable;
        me.enableDeleteScript = historyItem.enableDeleteScript;
        await me.convertToPostgresSQL();
      }
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
          config.enableDeleteScript = me.enableDeleteScript;
          config.enableCreateTable = me.enableCreateTable;
          me.outputSQL = me.buildScriptPostgreSQLScript(input, config);
          // Lưu text vào lịch sử nếu khác với lần lưu trước
          let historyItem = {
            inputJSON: me.inputJSON,
            tableName: me.tableName,
            schemaName: me.schemaName,
            primaryKeyField: me.primaryKeyField,
            enableCreateTable: me.enableCreateTable,
            enableDeleteScript: me.enableDeleteScript,
          };
          await me.$refs.history.saveToHistory(historyItem);
        }
      } catch (error) {
        console.error("Error in convertToPostgresSQL:", error);
      }
    },
    haddleCopyEvent() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.outputSQL);
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
                  v
                )
            )
          ) {
            dataType = "uuid";
          } else if (
            values.every(
              (v) =>
                typeof v === "string" &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)
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
      STRING_JOIN: ", ",
      STRING_JOIN_BREAKLINE: ";\n",
      NULL_VALUE: "null",
      config: null,
      tableName: null,
      schemaName: null,
      primaryKeyField: null,
      inputJSON: null,
      outputSQL: null,
      enableCreateTable: false,
      enableDeleteScript: true,
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
  column-gap: 20px;
  width: 95%;
}
.history-wrapper{
  width: 95%;
}
.history-container {
  width: 100%;
}
</style>
