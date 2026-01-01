<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="input-area">
        <!-- Nhập JSON trực tiếp -->
        <template v-if="!enableFileUpload">
          <TDTextarea
            isLabelTop
            :label="$t('i18nCommon.jsonToExcel.inputLabel')"
            :placeHolder="$t('i18nCommon.jsonToExcel.inputPlaceholder')"
            :wrapText="wrapText"
            :enableHighlight="enableHighlight"
            language="json"
            v-model="jsonSource"
          />
        </template>

        <!-- Upload file JSON -->
        <template v-else>
          <div class="upload-container">
            <TDUpload
              :label="$t('i18nCommon.jsonToPostgreSQL.uploadLabel')"
              :accept="'.json'"
              @change="handleFileUpload"
            />
          </div>
        </template>
      </div>

      <div class="flex">
        <template v-if="!enableFileUpload">
          <TDButton
            :label="$t('i18nCommon.jsonToExcel.convert')"
            @click="convertToExcel"
          />
        </template>

        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToExcel.example')"
        />
      </div>
    </div>

    <!-- Sidebar -->
    <TDSubSidebar v-model="isShowSidebar">
      <div class="flex flex-col td-sub-sidebar">
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="wrapText"
          :label="$t('i18nCommon.apiTesting.wrapText')"
        />
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="enableHighlight"
          :label="$t('i18nCommon.enableHighlight')"
        />
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="enableFileUpload"
          :label="$t('i18nCommon.jsonToPostgreSQL.useFileUpload')"
        />
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="isBoldColName"
          :label="$t('i18nCommon.jsonToExcel.boldColumns')"
        />
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="isFitColWidth"
          :label="$t('i18nCommon.jsonToExcel.fitColumns')"
        />
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="isFreezeFirstRow"
          :label="$t('i18nCommon.jsonToExcel.freezeRow')"
        />
      </div>
    </TDSubSidebar>
  </div>
</template>

<script>
import ExcelJS from "exceljs";
import TDSubSidebar from "@/components/TDSubSidebar.vue";

export default {
  name: "TDJSONToExcel",
  components: { TDSubSidebar },

  methods: {
    async applyMock() {
      const { TDMockJSONToExcel } = await import(
        /* webpackChunkName: "mock-json-to-excel" */
        "@/common/mock/TDMockJSONToExcel.js"
      );
      this.$tdUtility.applyMock(this, TDMockJSONToExcel);
    },

    /* ================= FILE UPLOAD ================= */
    async handleFileUpload(event) {
      let me = this;
      try {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith(".json")) {
          me.$tdToast.error(null, "Chỉ hỗ trợ file JSON");
          return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            me.jsonSource = e.target.result;
            await me.convertToExcel();
          } catch (err) {
            console.error("JSON parse error:", err);
            me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error("File upload error:", error);
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },

    /* ================= DATA PREPARE ================= */
    prepareData() {
      let arrObj = [];
      let obj = this.$tdUtility.JSONParse(this.jsonSource);
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
      if (!this.isBoldColName) return;
      const headers = this.getHeaderKeys(arr);
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => (cell.font = { bold: true }));
    },

    autoFitColumn(worksheet, arr) {
      if (!this.isFitColWidth) return;
      const headers = this.getHeaderKeys(arr);
      worksheet.columns = headers.map((field) => {
        const maxLen = Math.max(
          field.length,
          ...arr.map((row) => (row[field] ? String(row[field]).length : 0))
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
      return this.isFreezeFirstRow
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
          me.getConfigWorkSheet()
        );

        me.configBoldColumn(worksheet, arrObj);
        me.autoFitColumn(worksheet, arrObj);
        me.addDataToCell(worksheet, arrObj);

        const buffer = await workbook.xlsx.writeBuffer();
        me.$tdUtility.createDownloadFileFromBuffer(
          buffer,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          me.fileName
        );

        me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Convert excel error:", error);
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
  },

  data() {
    return {
      isShowSidebar: true,
      enableHighlight: true,
      enableFileUpload: false,
      wrapText: true,

      jsonSource: "",
      isBoldColName: true,
      isFitColWidth: true,
      isFreezeFirstRow: true,
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

.td-sub-sidebar {
  height: 100%;
  justify-content: flex-start;
  width: 100%;
}
</style>
