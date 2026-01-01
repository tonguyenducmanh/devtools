<template>
  <div class="flex container">
    <div class="flex flex-col main-tool">
      <div class="input-area">
        <TDTextarea
          isLabelTop
          :label="$t('i18nCommon.jsonToExcel.inputLabel')"
          :placeHolder="$t('i18nCommon.jsonToExcel.inputPlaceholder')"
          :wrapText="wrapText"
          :enableHighlight="enableHighlight"
          language="json"
          v-model="jsonSource"
        ></TDTextarea>
      </div>

      <div class="flex">
        <TDButton
          :label="$t('i18nCommon.jsonToExcel.convert')"
          @click="convertToExcel"
        ></TDButton>
        <TDButton
          @click="applyMock"
          :type="$tdEnum.buttonType.secondary"
          :label="$t('i18nCommon.jsonToExcel.example')"
        ></TDButton>
      </div>
    </div>
    <TDSubSidebar v-model="isShowSidebar">
      <div class="flex flex-col td-sidebar">
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="wrapText"
          :label="$t('i18nCommon.apiTesting.wrapText')"
        ></TDCheckbox>
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="enableHighlight"
          :label="$t('i18nCommon.enableHighlight')"
        ></TDCheckbox>
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="enableFileUpload"
          :label="$t('i18nCommon.jsonToPostgreSQL.useFileUpload')"
        ></TDCheckbox>
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="isBoldColName"
          :label="$t('i18nCommon.jsonToExcel.boldColumns')"
        ></TDCheckbox>
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="isFitColWidth"
          :label="$t('i18nCommon.jsonToExcel.fitColumns')"
        ></TDCheckbox>
        <TDCheckbox
          :variant="$tdEnum.checkboxType.switch"
          v-model="isFreezeFirstRow"
          :label="$t('i18nCommon.jsonToExcel.freezeRow')"
        ></TDCheckbox>
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
      const { TDMockJSONToExcel } = await import(
        /* webpackChunkName: "mock-json-to-excel" */
        "@/common/mock/TDMockJSONToExcel.js"
      );
      this.$tdUtility.applyMock(this, TDMockJSONToExcel);
    },
    /**
     * tiền xử lý dữ liệu
     */
    prepareData() {
      let me = this;
      let arrObj = [];
      let obj = me.$tdUtility.JSONParse(me.jsonSource);
      if (obj) {
        if (Array.isArray(obj)) {
          arrObj = obj;
        } else {
          arrObj = [obj];
        }
      }
      let flattenObj = me.flattenLevel1(arrObj);
      return flattenObj;
    },
    /**
     * chế lại dữ liệu để đảm bảo chỉ có key đầu tiên làm tên cột, value mà là object thì convert thành text trước khi xuất khẩu excel
     * @param jsonArray mảng object
     */
    flattenLevel1(jsonArray) {
      return jsonArray.map((row) => {
        const newRow = {};
        for (const key in row) {
          const value = row[key];
          if (typeof value === "object" && value !== null) {
            newRow[key] = JSON.stringify(value);
          } else {
            newRow[key] = value;
          }
        }
        return newRow;
      });
    },
    /**
     * cấu hình in đậm cột
     */
    configBoldColumn(worksheet, arr) {
      let me = this;
      // Lấy header từ keys của object đầu tiên
      if (me.isBoldColName) {
        let headerKeys = arr ? me.getHeaderKeys(arr) : [];
        if (headerKeys && headerKeys.length > 0 && worksheet) {
          const headerRow = worksheet.addRow(headerKeys);
          headerRow.eachCell((cell) => {
            cell.font = { bold: true };
          });
        }
      }
    },
    autoFitColumn(worksheet, arr) {
      let me = this;
      if (me.isFitColWidth && arr && arr.length > 0) {
        let headerKeys = me.getHeaderKeys(arr);
        if (
          worksheet &&
          worksheet.columns &&
          worksheet.columns.length > 0 &&
          headerKeys
        ) {
          // Tự động set độ rộng cột theo nội dung
          const colWidths = headerKeys.map((field) => {
            const maxLen = Math.max(
              field.length,
              ...arr.map((row) => (row[field] ? String(row[field]).length : 0))
            );
            return { header: field, key: field, width: maxLen + 2 }; // +2 để đệm
          });
          // Auto-fit chiều rộng cột
          worksheet.columns = colWidths;
        }
      }
    },
    /**
     * lấy ra danh sách tên cột
     */
    getHeaderKeys(arr) {
      let sampleObj = Array.isArray(arr) ? arr[0] : arr;
      const headerKeys = Object.keys(sampleObj || {});
      return headerKeys;
    },
    /**
     * thêm dữ liệu vào trong cell
     */
    addDataToCell(worksheet, arr) {
      let me = this;
      let headerKeys = arr ? me.getHeaderKeys(arr) : [];
      if (
        headerKeys &&
        headerKeys.length > 0 &&
        worksheet &&
        arr &&
        arr.length > 0
      ) {
        // Add data rows
        arr.forEach((item) => {
          worksheet.addRow(headerKeys.map((key) => item[key]));
        });
      }
    },
    getConfigWorkSheet() {
      let me = this;
      let configWorkSheet = null;
      if (me.isFreezeFirstRow) {
        configWorkSheet = {
          views: [{ state: "frozen", ySplit: 1 }],
        };
      }
      return configWorkSheet;
    },
    async convertToExcelFromHistory(text) {
      let me = this;
      me.jsonSource = text;
      me.convertToExcel();
    },
    /**
     * chuyển đổi sang excel
     */
    async convertToExcel() {
      let me = this;
      try {
        let arrObj = me.prepareData();
        const workbook = new ExcelJS.Workbook();
        let configWorkSheet = me.getConfigWorkSheet();
        const worksheet = workbook.addWorksheet("Sheet1", configWorkSheet);

        // in đậm cột đầu tiên
        me.configBoldColumn(worksheet, arrObj);

        // tự động co giãn theo độ rộng cột
        me.autoFitColumn(worksheet, arrObj);

        // thêm dữ liệu vào trong cell
        me.addDataToCell(worksheet, arrObj);

        // Ghi workbook ra buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Tạo blob và mở popup tải file
        me.$tdUtility.createDownloadFileFromBuffer(
          buffer,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          me.fileName
        );
        // Lưu text vào lịch sử nếu khác với lần lưu trước
        await me.$refs.history.saveToHistory(me.jsonSource);
        me.$tdToast.success(null, me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Error in convertToExcel:", error);
        me.$tdToast.error(null, me.$t("i18nCommon.toastMessage.error"));
      }
    },
  },
  data() {
    return {
      isShowSidebar: true,
      enableHighlight: true,
      splitHorizontal: true,
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
.io-section {
  column-gap: 20px;
}
.main-tool {
  flex: 1;
  height: 100%;
  .input-area {
    flex: 1;
    width: 100%;
  }
}
.td-sidebar {
  justify-content: flex-start;
  height: 100%;
}
</style>
