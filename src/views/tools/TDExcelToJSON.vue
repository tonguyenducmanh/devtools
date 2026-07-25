<template>
  <div class="flex container">
    <div class="flex flex-wrap flex-col main-area">
      <div
        class="flex io-section"
        :class="{ 'flex-col': currentConfigLayout.splitHorizontal }"
      >
        <TDUpload
          :label="$t('i18nCommon.excelToJSON.uploadLabel')"
          :accept="'.xlsx,.xls'"
          @selected="handleFileUpload"
        />
        <TDTextEditor
          isLabelTop
          :label="$t('i18nCommon.excelToJSON.outputLabel')"
          :readOnly="true"
          :enableHighlight="true"
          language="json"
          :placeHolder="$t('i18nCommon.excelToJSON.outputPlaceholder')"
          v-model="outputJSON"
          :wrapText="currentConfigLayout.wrapText"
        />
      </div>
      <div class="flex flex-wrap">
        <TDButton
          :label="$t('i18nCommon.excelToJSON.downloadJSON')"
          @click="downloadJSON"
          :disabled="!outputJSON"
          :noMargin="true"
        />
        <TDButton
          @click="copyOutput"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToPostgreSQL.copy')"
          :disabled="!outputJSON"
          :noMargin="true"
        />
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToExcel.example')"
          :noMargin="true"
        />
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
          <TDExcelToJSONHelp />
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
          />
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.splitHorizontal"
            :label="$t('i18nCommon.splitHorizontal')"
            @change="updateConfigLayout"
          />
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.outputAsArray"
            :label="$t('i18nCommon.excelToJSON.outputAsArray')"
            @change="updateConfigLayout"
          />
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.trimValues"
            :label="$t('i18nCommon.excelToJSON.trimValues')"
            @change="updateConfigLayout"
          />
          <TDCheckbox
            :variant="$tdEnum.checkboxType.switch"
            v-model="currentConfigLayout.allSheets"
            :label="$t('i18nCommon.excelToJSON.allSheets')"
            @change="updateConfigLayout"
          />
          <TDComboBox
            v-if="sheetNames.length > 1 && !currentConfigLayout.allSheets"
            v-model="selectedSheet"
            :options="sheetOptions"
            :noMargin="true"
            :width="280"
          />
        </div>
      </template>
    </TDSubSidebar>
  </div>
</template>

<script>
import ExcelJS from "exceljs";
import TDSubSidebar from "@/components/TDSubSidebar.vue";
import TDToolBase from "@/views/tools/base/TDToolBase.vue";
import TDExcelToJSONHelp from "@/views/helps/TDExcelToJSONHelp.vue";
export default {
  extends: TDToolBase,
  name: "TDExcelToJSON",
  components: { TDSubSidebar, TDExcelToJSONHelp },
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
    sheetOptions() {
      return this.sheetNames.map((name) => ({
        value: name,
        label: name,
      }));
    },
  },

  watch: {
    selectedSheet() {
      if (this.workbookData) {
        this.buildOutput();
      }
    },
    "currentConfigLayout.allSheets"() {
      if (this.workbookData) {
        this.buildOutput();
      }
    },
    "currentConfigLayout.outputAsArray"() {
      if (this.workbookData) {
        this.buildOutput();
      }
    },
    "currentConfigLayout.trimValues"() {
      if (this.workbookData) {
        this.buildOutput();
      }
    },
  },

  methods: {
    async applyMock() {
      const { TDMockExcelToJSON } = await import(
        /* webpackChunkName: "mock-excel-to-json" */
        "@/common/mock/TDMockExcelToJSON.js"
      );
      this.$tdUtility.applyMock(this, TDMockExcelToJSON);
    },

    async handleFileUpload(files) {
      let me = this;
      try {
        if (!files || files.length === 0) return;
        const file = files[0];
        const ext = file.name.split(".").pop().toLowerCase();
        if (!["xlsx", "xls"].includes(ext)) {
          me.$tdToast.error(me.$t("i18nCommon.excelToJSON.onlyExcelSupported"));
          return;
        }
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);

        me.sheetNames = workbook.worksheets.map((ws) => ws.name);
        me.selectedSheet = me.sheetNames[0] || "";
        me.workbookData = workbook;
        me.buildOutput();
        me.$tdToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Excel parse error:", error);
        me.$tdToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    worksheetToRows(worksheet) {
      let me = this;
      const rows = [];
      const headers = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            headers[cell.col] = me.getCellText(cell);
          });
          return;
        }
        const obj = {};
        row.eachCell({ includeEmpty: true }, (cell) => {
          const key = headers[cell.col] || `col_${cell.col}`;
          obj[key] = me.getCellText(cell);
        });
        rows.push(obj);
      });
      return rows;
    },

    getCellText(cell) {
      let me = this;
      let value = cell.value;
      if (value === null || value === undefined) return "";
      if (typeof value === "object") {
        if (value.text) value = value.text;
        else if (value.result !== undefined) value = value.result;
        else if (value.richText) {
          value = value.richText.map((r) => r.text).join("");
        } else {
          try {
            value = JSON.stringify(value);
          } catch {
            value = String(value);
          }
        }
      }
      value = String(value);
      if (me.currentConfigLayout.trimValues) {
        value = value.trim();
      }
      return value;
    },

    buildOutput() {
      let me = this;
      if (!me.workbookData) return;

      const outputAsObject = !me.currentConfigLayout.outputAsArray;
      const allSheets = me.currentConfigLayout.allSheets;

      if (outputAsObject && allSheets) {
        const result = {};
        me.sheetNames.forEach((name) => {
          const ws = me.workbookData.getWorksheet(name);
          if (ws) {
            result[name] = me.worksheetToRows(ws);
          }
        });
        me.outputJSON = JSON.stringify(result, null, 2);
      } else if (outputAsObject && !allSheets) {
        const ws = me.workbookData.getWorksheet(me.selectedSheet);
        if (ws) {
          const result = {};
          result[me.selectedSheet] = me.worksheetToRows(ws);
          me.outputJSON = JSON.stringify(result, null, 2);
        }
      } else if (!outputAsObject && allSheets) {
        const allRows = [];
        me.sheetNames.forEach((name) => {
          const ws = me.workbookData.getWorksheet(name);
          if (ws) {
            const rows = me.worksheetToRows(ws);
            rows.forEach((row) => {
              row.excel_sheet_name = name;
            });
            allRows.push(...rows);
          }
        });
        me.outputJSON = JSON.stringify(allRows, null, 2);
      } else {
        const ws = me.workbookData.getWorksheet(me.selectedSheet);
        if (ws) {
          const rows = me.worksheetToRows(ws);
          me.outputJSON = JSON.stringify(rows, null, 2);
        }
      }
    },

    copyOutput() {
      let me = this;
      me.$tdUtility.copyToClipboard(me.outputJSON);
    },

    downloadJSON() {
      let me = this;
      if (!me.outputJSON) return;
      const blob = new Blob([me.outputJSON], { type: "application/json" });
      me.$tdUtility.createDownloadFileFromBlob(
        blob,
        `${me.selectedSheet || me.$t("i18nCommon.excelToJSON.defaultFileName")}.json`,
      );
    },
  },

  data() {
    return {
      keyCacheLayout: this.$tdEnum.cacheConfig.ExcelToJSONConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tdEnum.ToolSidebarOption.Help,
        splitHorizontal: true,
        wrapText: true,
        allSheets: true,
        outputAsArray: false,
        trimValues: true,
      },
      workbookData: null,
      sheetNames: [],
      selectedSheet: "",
      outputJSON: "",
    };
  },
};
</script>

<style scoped lang="scss">
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
.td-sidebar-content {
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  overflow: auto;
}
</style>
