<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="input-area">
        <template v-if="!currentConfigLayout.enableFileUpload">
          <TMTextEditor
            isLabelTop
            :label="$t('i18nCommon.jsonToExcel.inputLabel')"
            :placeHolder="$t('i18nCommon.jsonToExcel.inputPlaceholder')"
            :wrapText="currentConfigLayout.wrapText"
            :enableHighlight="true"
            language="json"
            v-model="jsonSource"
          />
        </template>

        <!-- Upload file JSON -->
        <template v-else>
          <div class="upload-container">
            <TMUpload
              :label="$t('i18nCommon.jsonToPostgreSQL.uploadLabel')"
              :accept="'.json'"
              @change="handleFileUpload"
            />
          </div>
        </template>
      </div>

      <div class="flex">
        <template v-if="!currentConfigLayout.enableFileUpload">
          <TMButton
            :label="$t('i18nCommon.jsonToExcel.convert')"
            @click="convertToExcel"
          />
        </template>

        <TMButton
          @click="applyMock"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToExcel.example')"
        />
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
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Help
          "
        >
          <TMJSONToExcelHelp />
        </div>
        <div
          class="flex flex-col tm-sub-sidebar"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            titleKey="jsonSource"
            :noMargin="true"
            :cacheKey="$tmEnum.cacheConfig.JSONToExcelHistory"
          />
        </div>
        <div
          class="flex flex-col tm-sub-sidebar"
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
          />
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.enableFileUpload"
            :label="$t('i18nCommon.jsonToPostgreSQL.useFileUpload')"
            @change="updateConfigLayout"
          />
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.isBoldColName"
            :label="$t('i18nCommon.jsonToExcel.boldColumns')"
            @change="updateConfigLayout"
          />
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.isFitColWidth"
            :label="$t('i18nCommon.jsonToExcel.fitColumns')"
            @change="updateConfigLayout"
          />
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.isFreezeFirstRow"
            :label="$t('i18nCommon.jsonToExcel.freezeRow')"
            @change="updateConfigLayout"
          />
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import ExcelJS from "exceljs";
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMJSONToExcelHelp from "@/views/helps/TMJSONToExcelHelp.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
export default {
  extends: TMToolBase,
  name: "TMJSONToExcel",
  components: {
    TMSubSidebar,
    TMJSONToExcelHelp,
    TMHistorySidebar,
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

  methods: {
    async applyMock() {
      const { TMMockJSONToExcel } = await import(
        /* webpackChunkName: "mock-json-to-excel" */
        "@/common/mock/TMMockJSONToExcel.js"
      );
      this.$tmUtility.applyMock(this, TMMockJSONToExcel);
    },

    /* ================= FILE UPLOAD ================= */
    async handleFileUpload(event) {
      let me = this;
      try {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith(".json")) {
          me.$tmToast.error("Chỉ hỗ trợ file JSON");
          return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            me.jsonSource = e.target.result;
            await me.convertToExcel();
          } catch (err) {
            console.error("JSON parse error:", err);
            me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error("File upload error:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /* ================= DATA PREPARE ================= */
    prepareData() {
      let arrObj = [];
      let obj = this.$tmUtility.JSONParse(this.jsonSource);
      if (obj) {
        arrObj = Array.isArray(obj) ? obj : [obj];
      }
      return this.flattenLevel1(arrObj);
    },

    flattenLevel1(jsonArray) {
      return jsonArray.map((row) => {
        const newRow = {};
        for (const key in row) {
          const value = row[key];
          newRow[key] =
            typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : value;
        }
        return newRow;
      });
    },

    /* ================= EXCEL CONFIG ================= */
    getHeaderKeys(arr) {
      return Object.keys(arr?.[0] || {});
    },

    configBoldColumn(worksheet, arr) {
      if (!this.currentConfigLayout.isBoldColName) return;
      const headers = this.getHeaderKeys(arr);
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => (cell.font = { bold: true }));
    },

    autoFitColumn(worksheet, arr) {
      if (!this.currentConfigLayout.isFitColWidth) return;
      const headers = this.getHeaderKeys(arr);
      worksheet.columns = headers.map((field) => {
        const maxLen = Math.max(
          field.length,
          ...arr.map((row) => (row[field] ? String(row[field]).length : 0)),
        );
        return { header: field, key: field, width: maxLen + 2 };
      });
    },

    addDataToCell(worksheet, arr) {
      const headers = this.getHeaderKeys(arr);
      arr.forEach((item) => {
        worksheet.addRow(headers.map((key) => item[key]));
      });
    },

    getConfigWorkSheet() {
      return this.currentConfigLayout.isFreezeFirstRow
        ? { views: [{ state: "frozen", ySplit: 1 }] }
        : null;
    },

    /* ================= CONVERT ================= */
    async convertToExcel() {
      let me = this;
      try {
        const arrObj = me.prepareData();
        if (!arrObj || arrObj.length === 0) return;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(
          "Sheet1",
          me.getConfigWorkSheet(),
        );

        me.configBoldColumn(worksheet, arrObj);
        me.autoFitColumn(worksheet, arrObj);
        me.addDataToCell(worksheet, arrObj);

        const buffer = await workbook.xlsx.writeBuffer();
        me.$tmUtility.createDownloadFileFromBuffer(
          buffer,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          me.fileName,
        );
        await me.saveToHistory();

        me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Convert excel error:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },
    /**
     * Lưu input JSON hiện tại vào lịch sử
     */
    async saveToHistory() {
      let me = this;
      if (me.$refs.history && me.jsonSource) {
        let historyItem = {
          jsonSource: me.jsonSource,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    /**
     * Áp dụng input từ lịch sử (chỉ set input, không tự tải file)
     * @param {Object} item - Item lịch sử
     */
    handleApplyHistory(item) {
      let me = this;
      if (item && item.jsonSource) {
        me.jsonSource = item.jsonSource;
        me.currentConfigLayout.enableFileUpload = false;
        me.updateConfigLayout();
      }
    },
  },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.JSONToExcelConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        enableFileUpload: false,
        wrapText: true,
        isBoldColName: true,
        isFitColWidth: true,
        isFreezeFirstRow: true,
      },
      jsonSource: "",
      fileName: "du-lieu.xlsx",
    };
  },
};
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
}

.main-tool {
  flex: 1;
  height: 100%;
}

.input-area {
  flex: 1;
  width: 100%;
}

.upload-container {
  width: 100%;
  min-height: 200px;
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tm-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
  overflow: auto;
}
</style>
